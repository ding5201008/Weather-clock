
export interface WeatherData {
  temp: string;
  condition: string;
  location: string;
  humidity: string;
  wind: string;
  forecast: Array<{
    day: string;
    temp: string;
    condition: string;
  }>;
  groundingUrls: Array<{ title: string; uri: string }>;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Alarm {
  id: string;
  time: string; // HH:MM format
  enabled: boolean;
  label?: string;
}
