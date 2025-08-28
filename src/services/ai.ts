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
      // Try Gemini API
      if (this.geminiApiKey) {
        console.log('Trying Gemini API...');
        const response = await this.queryGemini(medicineName);
        if (response.success) {
          console.log('Gemini API successful');
          return response;
        }
        console.log('Gemini API failed, using mock data...');
      }

      // If no API key or failed, return mock data
      console.log('Using mock data for demonstration');
      return this.getMockMedicineInfo(medicineName);
    } catch (error) {
      console.error('Error getting medicine info:', error);
      return {
        success: false,
        error: 'Failed to get medicine information. Please try again.',
      };
    }
  }

  // Enhanced chat response that includes user's medicine context
  async getChatResponse(message: string, userId: string): Promise<string> {
    try {
      // Get user's medicines for context
      const userMedicines = await this.getUserMedicines(userId);
      
      // Try Gemini API with medicine context
      if (this.geminiApiKey) {
        console.log('Trying Gemini API for chat with medicine context...');
        try {
          const response = await this.queryGeminiChatWithContext(message, userId, userMedicines);
          if (response) {
            console.log('Gemini chat API successful');
            return response;
          }
        } catch (apiError: any) {
          console.error('Gemini API error in chat:', apiError);
          
          // Handle rate limiting specifically
          if (apiError.message?.includes('Rate limit exceeded')) {
            return 'I\'m currently experiencing high traffic. Please wait a moment and try again, or I can provide general information without using the AI service.';
          }
          
          console.log('Gemini chat API failed, falling back to mock response...');
        }
      }

      // If no API key or failed, return mock response with medicine context
      console.log('Using mock chat response with medicine context for demonstration');
      return this.getMockChatResponseWithContext(message, userMedicines);
    } catch (error) {
      console.error('Error getting chat response:', error);
      return 'I apologize, but I encountered an error. Please try again or rephrase your question.';
    }
  }



  private async queryGemini(medicineName: string): Promise<AIResponse> {
    try {
      // Check rate limit before making request
      await this.checkRateLimit();
      
      const prompt = this.buildMedicinePrompt(medicineName);
      
      // Debug: Log the API key (first 10 characters for security)
      console.log('Gemini API Key (first 10 chars):', this.geminiApiKey?.substring(0, 10) + '...');
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
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
    return `Please provide information about the medicine "${medicineName}" in the following JSON format:

{
  "medicineName": "${medicineName}",
  "uses": "What is this medicine used for?",
  "sideEffects": "What are the common side effects?",
  "description": "Brief description of the medicine",
  "dosageInfo": "General dosage information and instructions",
  "interactions": "Drug interactions and contraindications",
  "warnings": "Important warnings and precautions"
}

Please provide accurate, medical information. If you're not sure about specific details, mention that this is general information and that users should consult their healthcare provider.`;
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
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
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
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data: {
            medicineName: parsed.medicineName || medicineName,
            uses: parsed.uses || 'Information not available',
            sideEffects: parsed.sideEffects || 'Information not available',
            description: parsed.description || 'Information not available',
            dosageInfo: parsed.dosageInfo || 'Information not available',
            interactions: parsed.interactions || 'Information not available',
            warnings: parsed.warnings || 'Information not available',
          },
        };
      }

      // If no JSON found, return structured text
      return {
        success: true,
        data: {
          medicineName,
          uses: 'Please consult your healthcare provider for specific information about uses.',
          sideEffects: 'Please consult your healthcare provider for information about side effects.',
          description: content.substring(0, 200) + '...',
          dosageInfo: 'Please consult your healthcare provider for dosage information.',
          interactions: 'Please consult your healthcare provider for interaction information.',
          warnings: 'Please consult your healthcare provider for warnings and precautions.',
        },
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.getMockMedicineInfo(medicineName);
    }
  }

  private getMockMedicineInfo(medicineName: string): AIResponse {
    return {
      success: true,
      data: {
        medicineName,
        uses: `This is a demonstration of the AI medicine information feature for "${medicineName}". In a real implementation with valid API keys, this would show actual medical information from DeepSeek or Gemini AI services.`,
        sideEffects: 'Common side effects may include nausea, headache, and dizziness. Always consult your healthcare provider for complete information.',
        description: `${medicineName} is a medication used to treat various conditions. The exact description would be provided by the AI service based on the medicine name.`,
        dosageInfo: 'Dosage varies based on individual factors. Always follow your healthcare provider\'s instructions.',
        interactions: 'May interact with other medications. Consult your healthcare provider before taking with other medicines.',
        warnings: 'Keep out of reach of children. Store in a cool, dry place. Consult your healthcare provider for specific warnings.',
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
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
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
