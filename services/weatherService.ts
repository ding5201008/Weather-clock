import { WeatherData, Coordinates } from "../types";

const AMAP_KEY = "f4730573cccfa6d3a276e6a6ca159e22";

export const fetchWeatherFromGemini = async (coords: Coordinates): Promise<WeatherData> => {
  // NOTE: Function name kept as fetchWeatherFromGemini for compatibility with existing imports,
  // but implementation is Amap (Gaode).
  
  try {
    // 1. Reverse Geocode to get Adcode/City
    const location = `${coords.longitude.toFixed(6)},${coords.latitude.toFixed(6)}`;
    const regeoUrl = `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${location}&extensions=base`;
    
    const regeoRes = await fetch(regeoUrl);
    const regeoData = await regeoRes.json();
    
    if (regeoData.status !== "1") {
      console.error("Regeo failed:", regeoData);
      throw new Error(`Location failed: ${regeoData.info}`);
    }

    const component = regeoData.regeocode.addressComponent;
    
    // Helper to safely extract string from potential array or string
    const safeString = (val: any) => (Array.isArray(val) ? (val.length > 0 ? val[0] : "") : val || "");

    const adcode = safeString(component.adcode);
    const district = safeString(component.district);
    const city = safeString(component.city);
    const province = safeString(component.province);

    // 2. Helper to fetch weather with fallback capability
    const fetchAmapWeather = async (query: string) => {
        if (!query) return null;
        // CRITICAL FIX: encodeURIComponent is required for Chinese characters in the URL
        const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=${AMAP_KEY}&city=${encodeURIComponent(query)}&extensions=base`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.status === "1" && data.lives && data.lives.length > 0) {
                return data.lives[0];
            }
        } catch (e) {
            console.warn(`Fetch failed for query ${query}`, e);
        }
        return null;
    };

    // 3. Fallback Strategy
    // We try to fetch weather using these keys in order of precision.
    const candidates = [
        adcode,
        district,
        city,
        province
    ].filter(c => c && typeof c === 'string' && c.trim() !== "");

    // Remove duplicates
    const uniqueCandidates = [...new Set(candidates)];
    
    let current = null;
    let successfulQuery = "";

    for (const query of uniqueCandidates) {
        current = await fetchAmapWeather(query);
        if (current) {
            successfulQuery = query;
            break;
        }
    }

    // 4. Ultimate Fallback (Beijing) to prevent app crash if all else fails
    if (!current) {
      console.warn("Weather fetch failed for all candidates:", uniqueCandidates, "Falling back to Beijing.");
      const fallbackQuery = "110000"; // Beijing Adcode
      current = await fetchAmapWeather(fallbackQuery);
      successfulQuery = fallbackQuery;
      
      if (!current) {
          // Final fallback mock data so the app doesn't show red error screen
           console.error("Failed to fetch live weather from Amap (even fallback failed)");
           return {
                temp: "--",
                condition: "数据不可用",
                location: "离线",
                humidity: "-",
                wind: "-",
                forecast: [],
                groundingUrls: []
           };
      }
    }

    // 5. Get Forecast
    // Use the query that worked for live weather to ensure consistency
    const forecastUrl = `https://restapi.amap.com/v3/weather/weatherInfo?key=${AMAP_KEY}&city=${encodeURIComponent(successfulQuery)}&extensions=all`;
    const forecastRes = await fetch(forecastUrl);
    const forecastData = await forecastRes.json();

    const forecasts = (forecastData.forecasts?.[0]?.casts || []).slice(1, 4).map((day: any) => {
      // Convert week number to Chinese Day Name
      const weekMap: Record<string, string> = {
        "1": "周一", "2": "周二", "3": "周三", "4": "周四", "5": "周五", "6": "周六", "7": "周日"
      };
      
      return {
        day: weekMap[day.week] || "未知",
        temp: `${day.daytemp}° / ${day.nighttemp}°`,
        condition: day.dayweather === day.nightweather ? day.dayweather : `${day.dayweather}转${day.nightweather}`
      };
    });

    // Determine display location name: prefer District > City > Province
    const displayLocation = district || city || province || adcode;

    return {
      temp: `${current.temperature}°C`,
      condition: current.weather,
      location: displayLocation, 
      humidity: `${current.humidity}%`,
      wind: `${current.winddirection}风 ${current.windpower}级`,
      forecast: forecasts,
      groundingUrls: [] 
    };

  } catch (error) {
    console.error("Weather fetch error:", error);
    throw error;
  }
};