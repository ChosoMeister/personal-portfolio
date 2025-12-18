
import { GoogleGenAI } from "@google/genai";
import { PriceData } from '../types';
import { API } from './api';

// ایمن‌سازی کلید API - از متغیرهای محیطی با پیشوند VITE برای کلاینت و گزینه‌های سرور پشتیبانی می‌کند
const resolveApiKey = (): string => {
  // Vite در زمان بیلد فقط متغیرهای با پیشوند VITE_ را به فرانت‌اند اکسپوز می‌کند
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || import.meta.env.API_KEY || '';
  }

  // در محیط‌های Node (اسکریپت‌ها یا تست‌ها)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  }

  return '';
};

const getAIClient = () => {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Set VITE_GEMINI_API_KEY in your environment.');
  }
  return new GoogleGenAI({ apiKey });
};

const DEFAULT_PRICES: PriceData = {
  usdToToman: 70000, 
  eurToToman: 74000,
  gold18ToToman: 4700000, 
  cryptoUsdPrices: {
    'USDT': 1.00,
    'ETH': 2500.00,
    'ADA': 0.60,
    'ETC': 22.00,
  },
  fetchedAt: Date.now(),
};

export const fetchPrices = async (): Promise<PriceData> => {
  const stored = await API.getPrices();
  return stored || DEFAULT_PRICES;
};

export const fetchLivePricesWithAI = async (): Promise<{ data: PriceData, sources: {title: string, uri: string}[] }> => {
  try {
    const ai = getAIClient();
    const now = new Date();
    const persianDate = now.toLocaleDateString('fa-IR');

    const prompt = `امروز ${persianDate} است. 
    قیمت‌های لحظه‌ای بازار آزاد تهران را از سایت‌های معتبر پیدا کن.
    من این ۳ مورد را به تومان نیاز دارم:
    1. دلار آمریکا
    2. یورو
    3. طلا ۱۸ عیار
    خروجی JSON: {"usd": number, "eur": number, "gold": number}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    });

    const text = response.text || "{}";
    const cleanJson = JSON.parse(text);
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || 'منبع معتبر قیمت',
        uri: chunk.web?.uri || '#'
      }))
      .filter((s: any) => s.uri !== '#') || [];

    const updatedData: PriceData = {
      ...DEFAULT_PRICES,
      usdToToman: cleanJson.usd || DEFAULT_PRICES.usdToToman,
      eurToToman: cleanJson.eur || DEFAULT_PRICES.eurToToman,
      gold18ToToman: cleanJson.gold || DEFAULT_PRICES.gold18ToToman,
      fetchedAt: Date.now(),
    };

    await API.savePrices(updatedData);
    return { data: updatedData, sources };
  } catch (error) {
    console.error("AI Price Fetch Error:", error);
    const lastStored = await API.getPrices();
    return { data: lastStored || DEFAULT_PRICES, sources: [] };
  }
};
