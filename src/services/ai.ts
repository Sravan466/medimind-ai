// AI Service for MediMind AI

import axios from 'axios';
import { MedicineInfoCache, Medicine } from '../types/database';
import { medicineService } from './supabase';

export interface MedicineInfo {
  medicineName: string;
  uses: string;
  sideEffects: string;
  description: string;
  dosageInfo: string;
  interactions: string;
  warnings: string;
}

export interface AIResponse {
  success: boolean;
  data?: MedicineInfo;
  error?: string;
}

export class AIService {
  private static instance: AIService;
  private geminiApiKey: string | undefined;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests
  private readonly MAX_REQUESTS_PER_MINUTE = 30;

  private constructor() {
    this.geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    console.log('[AI_SERVICE] Gemini API Key available:', !!this.geminiApiKey);
    if (this.geminiApiKey) {
      console.log('[AI_SERVICE] API Key length:', this.geminiApiKey.length);
    }
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    
    // Reset counter if a minute has passed
    if (now - this.lastRequestTime > 60000) {
      this.requestCount = 0;
    }
    
    // Check if we've exceeded the rate limit
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      throw new Error('Rate limit exceeded. Please wait a moment before making another request.');
    }
    
    // Add delay between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest));
    }
    
    this.lastRequestTime = now;
    this.requestCount++;
  }

  // New function to get user's medicines
  async getUserMedicines(userId: string): Promise<Medicine[]> {
    try {
      const { data, error } = await medicineService.getMedicines(userId);
      if (error) {
        console.error('Error fetching user medicines:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching user medicines:', error);
      return [];
    }
  }

  async getMedicineInfo(medicineName: string): Promise<AIResponse> {
    try {
      console.log(`[MEDICINE_INFO] Getting info for: ${medicineName}`);
      
      // Try Gemini API
      if (this.geminiApiKey && this.geminiApiKey.trim().length > 0) {
        console.log('[MEDICINE_INFO] Trying Gemini API...');
        try {
          const response = await this.queryGemini(medicineName);
          if (response.success && response.data) {
            console.log('[MEDICINE_INFO] Gemini API successful');
            return response;
          }
          console.log('[MEDICINE_INFO] Gemini API returned no data');
        } catch (apiError) {
          console.error('[MEDICINE_INFO] Gemini API error:', apiError);
        }
      } else {
        console.log('[MEDICINE_INFO] No Gemini API key available');
      }

      // Fallback to mock data
      console.log('[MEDICINE_INFO] Using mock data');
      return this.getMockMedicineInfo(medicineName);
    } catch (error) {
      console.error('[MEDICINE_INFO] Error getting medicine info:', error);
      return {
        success: false,
        error: 'Failed to get medicine information. Please try again.',
      };
    }
  }

  // Enhanced chat response that includes user's medicine context
  async getChatResponse(message: string, userId: string): Promise<string> {
    try {
      console.log('[AI_SERVICE] Getting chat response for message:', message.substring(0, 50) + '...');
      
      // Get user's medicines for context
      const userMedicines = await this.getUserMedicines(userId);
      console.log('[AI_SERVICE] User has', userMedicines.length, 'medicines');
      
      // Try Gemini API with medicine context
      if (this.geminiApiKey && this.geminiApiKey.trim().length > 0) {
        console.log('[AI_SERVICE] Attempting Gemini API call...');
        try {
          const response = await this.queryGeminiChatWithContext(message, userId, userMedicines);
          if (response && response.trim().length > 0) {
            console.log('[AI_SERVICE] Gemini API successful, response length:', response.length);
            return response;
          }
          console.log('[AI_SERVICE] Gemini API returned empty response');
        } catch (apiError: any) {
          console.error('[AI_SERVICE] Gemini API error:', apiError.message || apiError);
          
          // Handle specific error cases
          if (apiError.response?.status === 400) {
            console.log('[AI_SERVICE] API key invalid, falling back to mock');
          } else if (apiError.response?.status === 429) {
            return 'I\'m currently experiencing high traffic. Please wait a moment and try again.';
          } else if (apiError.response?.status === 403) {
            console.log('[AI_SERVICE] API access forbidden, falling back to mock');
          }
        }
      } else {
        console.log('[AI_SERVICE] No valid Gemini API key, using mock response');
      }

      // Fallback to mock response with medicine context
      console.log('[AI_SERVICE] Using mock chat response');
      return this.getMockChatResponseWithContext(message, userMedicines);
    } catch (error) {
      console.error('[AI_SERVICE] Error in getChatResponse:', error);
      return 'I apologize, but I encountered an error. Please try again or rephrase your question.';
    }
  }



  private async queryGemini(medicineName: string): Promise<AIResponse> {
    try {
      // Check rate limit before making request
      await this.checkRateLimit();
      
      const prompt = this.buildMedicinePrompt(medicineName);
      
      // Validate API key format
      if (!this.geminiApiKey || this.geminiApiKey.length < 30) {
        throw new Error('Invalid Gemini API key format');
      }
      
      console.log('[GEMINI] Making API request to Gemini...');
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `You are a medical information assistant. Provide accurate, helpful information about medicines in a structured format.\n\n${prompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.candidates[0]?.content?.parts[0]?.text;
      if (!content) {
        throw new Error('No response content from Gemini');
      }

      return this.parseAIResponse(content, medicineName);
    } catch (error: any) {
      console.error('Gemini API error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Handle rate limiting (429 error)
      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please wait a moment and try again. You can also try using a different AI service.',
        };
      }
      
      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Gemini API: Model not found. Please check your API key and model access.',
        };
      }
      if (error.response?.status === 400) {
        return {
          success: false,
          error: 'Gemini API: Bad request. Please check your API key format.',
        };
      }
      return {
        success: false,
        error: 'Gemini API error: ' + (error.response?.data?.error?.message || error.message),
      };
    }
  }

  private buildMedicinePrompt(medicineName: string): string {
    return `Please provide detailed information about the medicine "${medicineName}". Structure your response with clear sections:

DESCRIPTION:
[Brief description of what this medicine is and what it does]

USES:
[What conditions this medicine treats and how it works]

SIDE EFFECTS:
[Common and serious side effects to watch for]

DOSAGE INFORMATION:
[Typical dosing instructions and administration guidelines]

DRUG INTERACTIONS:
[Important drug interactions and contraindications]

WARNINGS:
[Critical warnings, precautions, and safety information]

Please provide accurate medical information. Always remind users to consult their healthcare provider for personalized medical advice.`;
  }

  private async queryGeminiChatWithContext(message: string, userId: string, userMedicines: Medicine[]): Promise<string> {
    try {
      // Check rate limit before making request
      await this.checkRateLimit();
      
      // Build context about user's medicines
      const medicineContext = this.buildMedicineContext(userMedicines);
      
      const prompt = `You are Cura, a medical AI assistant for MediMind AI. You have access to the user's current medicines and can provide personalized advice.

${medicineContext}

User's question: ${message}

Please provide a helpful, accurate, and personalized response. If the user asks about their medicines, refer to the specific medicines they are taking. If they ask about side effects, interactions, or dosage, provide information relevant to their specific medications.

Always remind users to consult with their healthcare provider for medical advice.`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return response.data.candidates[0].content.parts[0].text;
      } else {
        console.error('Unexpected Gemini response structure:', response.data);
        throw new Error('Invalid response structure from Gemini API');
      }
    } catch (error: any) {
      console.error('Gemini API error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        
        // Handle rate limiting (429 error)
        if (error.response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again. You can also try using a different AI service.');
        }
      }
      throw error;
    }
  }

  private buildMedicineContext(userMedicines: Medicine[]): string {
    if (userMedicines.length === 0) {
      return "The user is not currently taking any medicines.";
    }

    let context = "The user is currently taking the following medicines:\n\n";
    
    userMedicines.forEach((medicine, index) => {
      context += `${index + 1}. **${medicine.name}**\n`;
      context += `   - Dosage: ${medicine.dosage}\n`;
      context += `   - Frequency: ${medicine.frequency}\n`;
      if (medicine.times && medicine.times.length > 0) {
        context += `   - Times: ${medicine.times.join(', ')}\n`;
      }
      if (medicine.days && medicine.days.length > 0) {
        context += `   - Days: ${medicine.days.join(', ')}\n`;
      }
      context += `   - Status: ${medicine.is_active ? 'Active' : 'Inactive'}\n`;
      if (medicine.notes) {
        context += `   - Notes: ${medicine.notes}\n`;
      }
      context += '\n';
    });

    return context;
  }

  private getMockChatResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('side effect')) {
      return "Side effects can vary from person to person. Common ones may include nausea, headache, or dizziness. It's important to monitor how you feel and report any concerning symptoms to your healthcare provider. They can help determine if the side effects are normal or if adjustments are needed.";
    }
    
    if (lowerMessage.includes('food') || lowerMessage.includes('meal')) {
      return "Some medicines work better with food, while others should be taken on an empty stomach. Check the instructions on your medicine label or ask your pharmacist. If you're unsure, taking with a small meal is usually safe, but always follow your healthcare provider's specific instructions.";
    }
    
    if (lowerMessage.includes('miss') || lowerMessage.includes('forgot')) {
      return "If you miss a dose, don't double up on your next dose. Take it as soon as you remember, unless it's close to your next scheduled dose. If you're unsure, check with your healthcare provider or pharmacist about the best approach for your specific medicine.";
    }
    
    if (lowerMessage.includes('interaction') || lowerMessage.includes('drug')) {
      return "Drug interactions can be serious. Always tell your healthcare provider about all medicines, supplements, and vitamins you're taking. They can check for potential interactions and adjust your treatment plan if needed. When in doubt, ask your pharmacist.";
    }
    
    if (lowerMessage.includes('store') || lowerMessage.includes('keep')) {
      return "Most medicines should be stored in a cool, dry place away from direct sunlight and heat. Keep them out of reach of children and pets. Some medicines need refrigeration - check the label. Don't store medicines in the bathroom due to humidity.";
    }
    
    return "Thank you for your question! I'm here to help with general health and medicine information. For specific medical advice about your situation, please consult your healthcare provider. They know your medical history and can provide personalized guidance.";
  }

  private getMockChatResponseWithContext(message: string, userMedicines: Medicine[]): string {
    const lowerMessage = message.toLowerCase();
    
    // Check if user is asking about their medicines
    if (lowerMessage.includes('my medicine') || lowerMessage.includes('my medicines') || lowerMessage.includes('my medication')) {
      if (userMedicines.length === 0) {
        return "You're not currently taking any medicines. You can add medicines in the Medicines tab to get personalized advice about them.";
      }
      
      if (lowerMessage.includes('side effect')) {
        const medicineNames = userMedicines.map(m => m.name).join(', ');
        return `I can see you're taking: ${medicineNames}. 

For side effects, here's what you should know:
- **${userMedicines[0].name}**: Common side effects may include nausea, headache, and dizziness. Monitor for any unusual symptoms.
${userMedicines.length > 1 ? `- **${userMedicines[1].name}**: May cause fatigue, stomach upset, or changes in appetite.` : ''}

⚠️ **Important**: This is general information. Always consult your healthcare provider for specific side effects related to your condition and dosage. If you experience severe side effects, contact your doctor immediately.`;
      }
      
      if (lowerMessage.includes('interaction')) {
        const medicineNames = userMedicines.map(m => m.name).join(', ');
        return `Regarding interactions between your medicines (${medicineNames}):

${userMedicines.length > 1 ? 
  `- **${userMedicines[0].name}** and **${userMedicines[1].name}**: May interact. Monitor for increased side effects.` : 
  `- **${userMedicines[0].name}**: Check with your pharmacist about food and other medication interactions.`
}

💡 **Tip**: Always inform your healthcare providers about all medicines you're taking, including over-the-counter drugs and supplements.

⚠️ **Important**: Consult your doctor or pharmacist for specific interaction advice.`;
      }
      
      // General medicine question
      const medicineNames = userMedicines.map(m => m.name).join(', ');
      return `You're currently taking: ${medicineNames}.

I can help you with:
- Side effects and safety information
- Drug interactions
- Dosage timing and instructions
- Storage recommendations
- What to do if you miss a dose

What specific information would you like about your medicines?`;
    }
    
         // Default responses for other questions
     if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
       return "Hello! I'm Cura, your AI health companion. I can see your medicines and provide personalized advice. How can I help you today?";
     }
    
    if (lowerMessage.includes('side effect')) {
      return "I'd be happy to help with side effects! Could you specify which medicine you're asking about, or would you like information about all your current medicines?";
    }
    
    if (lowerMessage.includes('dosage') || lowerMessage.includes('dose')) {
      return "For dosage information, I can help you understand your current prescriptions. Which medicine would you like to know more about?";
    }
    
         return "I'm Cura, your AI health companion! I can see your current medicines and provide personalized advice. What would you like to know?";
  }

  private parseAIResponse(content: string, medicineName: string): AIResponse {
    try {
      console.log('[AI_PARSE] Raw content:', content.substring(0, 200) + '...');
      
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('[AI_PARSE] Successfully parsed JSON');
          return {
            success: true,
            data: {
              medicineName: parsed.medicineName || medicineName,
              uses: parsed.uses || 'Information not available. Please consult your healthcare provider.',
              sideEffects: parsed.sideEffects || 'Information not available. Please consult your healthcare provider.',
              description: parsed.description || 'Information not available. Please consult your healthcare provider.',
              dosageInfo: parsed.dosageInfo || 'Information not available. Please consult your healthcare provider.',
              interactions: parsed.interactions || 'Information not available. Please consult your healthcare provider.',
              warnings: parsed.warnings || 'Information not available. Please consult your healthcare provider.',
            },
          };
        } catch (jsonError) {
          console.log('[AI_PARSE] JSON parsing failed, using text parsing');
        }
      }

      // If JSON parsing fails, try to extract structured information from text
      const structuredData = this.parseTextResponse(content, medicineName);
      if (structuredData) {
        return { success: true, data: structuredData };
      }

      // Final fallback
      console.log('[AI_PARSE] Using fallback mock data');
      return this.getMockMedicineInfo(medicineName);
    } catch (error) {
      console.error('[AI_PARSE] Error parsing AI response:', error);
      return this.getMockMedicineInfo(medicineName);
    }
  }
  
  private parseTextResponse(content: string, medicineName: string): MedicineInfo | null {
    try {
      console.log('[AI_PARSE] Parsing text response for:', medicineName);
      
      // Remove any JSON markers or code blocks
      const cleanContent = content.replace(/```json|```|\*\*|\*/g, '').trim();
      
      // If content looks like raw JSON string, don't show it
      if (cleanContent.startsWith('{') && cleanContent.includes('"medicineName"')) {
        console.log('[AI_PARSE] Detected raw JSON, rejecting');
        return null;
      }
      
      // Extract sections using the new structured format
      const sections = {
        description: this.extractStructuredSection(cleanContent, 'DESCRIPTION'),
        uses: this.extractStructuredSection(cleanContent, 'USES'),
        sideEffects: this.extractStructuredSection(cleanContent, 'SIDE EFFECTS'),
        dosageInfo: this.extractStructuredSection(cleanContent, 'DOSAGE INFORMATION'),
        interactions: this.extractStructuredSection(cleanContent, 'DRUG INTERACTIONS'),
        warnings: this.extractStructuredSection(cleanContent, 'WARNINGS')
      };
      
      // If we got good structured data, use it
      if (sections.description || sections.uses) {
        console.log('[AI_PARSE] Successfully extracted structured sections');
        return {
          medicineName,
          description: sections.description || `Information about ${medicineName}. Please consult your healthcare provider for detailed information.`,
          uses: sections.uses || 'Please consult your healthcare provider for information about uses.',
          sideEffects: sections.sideEffects || 'Please consult your healthcare provider for information about side effects.',
          dosageInfo: sections.dosageInfo || 'Please consult your healthcare provider for dosage information.',
          interactions: sections.interactions || 'Please consult your healthcare provider for interaction information.',
          warnings: sections.warnings || 'Please consult your healthcare provider for warnings and precautions.',
        };
      }
      
      console.log('[AI_PARSE] No structured sections found');
      return null;
    } catch (error) {
      console.error('[AI_PARSE] Error parsing text response:', error);
      return null;
    }
  }
  
  private extractStructuredSection(content: string, sectionName: string): string | null {
    try {
      // Look for section headers like "DESCRIPTION:" or "USES:"
      const regex = new RegExp(`${sectionName}:\s*\n?([\s\S]*?)(?=\n[A-Z\s]+:|$)`, 'i');
      const match = content.match(regex);
      
      if (match && match[1]) {
        const sectionContent = match[1].trim();
        // Clean up the content
        return sectionContent.replace(/\[.*?\]/g, '').trim();
      }
      
      return null;
    } catch (error) {
      console.error('[AI_PARSE] Error extracting section:', sectionName, error);
      return null;
    }
  }
  
  private extractSection(content: string, keywords: string[]): string | null {
    for (const keyword of keywords) {
      const regex = new RegExp(`${keyword}[:\s]*([^\n]{50,200})`, 'i');
      const match = content.match(regex);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  private getMockMedicineInfo(medicineName: string): AIResponse {
    // Provide more realistic mock data based on common medicines
    const commonMedicines: { [key: string]: Partial<MedicineInfo> } = {
      'paracetamol': {
        uses: 'Used to treat mild to moderate pain and reduce fever. Effective for headaches, muscle aches, arthritis, backache, toothaches, colds, and fevers.',
        sideEffects: 'Generally well-tolerated. Rare side effects may include skin rash, nausea, or allergic reactions. Overdose can cause serious liver damage.',
        dosageInfo: 'Adults: 500-1000mg every 4-6 hours. Maximum 4000mg per day. Children: Dose based on weight. Always follow package instructions.',
        interactions: 'May interact with warfarin, increasing bleeding risk. Avoid alcohol to prevent liver damage.',
        warnings: 'Do not exceed recommended dose. Avoid if allergic to paracetamol. Consult doctor if symptoms persist beyond 3 days.'
      },
      'ibuprofen': {
        uses: 'Anti-inflammatory drug used for pain relief, reducing inflammation, and lowering fever. Effective for headaches, dental pain, menstrual cramps, muscle aches, and arthritis.',
        sideEffects: 'May cause stomach upset, heartburn, dizziness, or drowsiness. Long-term use may increase risk of heart problems or stomach bleeding.',
        dosageInfo: 'Adults: 200-400mg every 4-6 hours. Maximum 1200mg per day without medical supervision. Take with food to reduce stomach irritation.',
        interactions: 'May interact with blood thinners, ACE inhibitors, and diuretics. Can reduce effectiveness of blood pressure medications.',
        warnings: 'Avoid if allergic to NSAIDs, have stomach ulcers, or severe heart/kidney disease. Not recommended during pregnancy.'
      }
    };
    
    const lowerName = medicineName.toLowerCase();
    const mockData = commonMedicines[lowerName] || {};
    
    return {
      success: true,
      data: {
        medicineName,
        description: mockData.uses || `${medicineName} is a medication. For accurate information about this specific medicine, please consult your healthcare provider or pharmacist.`,
        uses: mockData.uses || 'Please consult your healthcare provider for specific information about uses and indications.',
        sideEffects: mockData.sideEffects || 'Please consult your healthcare provider for information about potential side effects and adverse reactions.',
        dosageInfo: mockData.dosageInfo || 'Dosage varies based on individual factors including age, weight, and medical condition. Always follow your healthcare provider\'s instructions.',
        interactions: mockData.interactions || 'May interact with other medications, supplements, or medical conditions. Consult your healthcare provider before use.',
        warnings: mockData.warnings || 'Keep out of reach of children. Store as directed. Do not exceed recommended dose. Consult your healthcare provider for specific warnings and precautions.',
      },
    };
  }

  // Convert MedicineInfo to database format
  toDatabaseFormat(info: MedicineInfo): Omit<MedicineInfoCache, 'id' | 'created_at' | 'updated_at'> {
    return {
      medicine_name: info.medicineName,
      uses: info.uses,
      side_effects: info.sideEffects,
      description: info.description,
      dosage_info: info.dosageInfo,
      interactions: info.interactions,
    };
  }

  // Convert database format to MedicineInfo
  fromDatabaseFormat(dbInfo: MedicineInfoCache): MedicineInfo {
    return {
      medicineName: dbInfo.medicine_name,
      uses: dbInfo.uses,
      sideEffects: dbInfo.side_effects,
      description: dbInfo.description,
      dosageInfo: dbInfo.dosage_info || '',
      interactions: dbInfo.interactions || '',
      warnings: 'Please consult your healthcare provider for warnings and precautions.',
    };
  }

  // Test Gemini API key
  async testGeminiAPI(): Promise<boolean> {
    if (!this.geminiApiKey) {
      console.log('No Gemini API key found');
      return false;
    }

    try {
      console.log('Testing Gemini API key...');
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: 'Hello, this is a test message.'
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 50,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Gemini API test successful!');
      return true;
    } catch (error: any) {
      console.error('Gemini API test failed:', error.response?.status, error.response?.data);
      return false;
    }
  }
}

export const aiService = AIService.getInstance();
