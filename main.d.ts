interface String {
  toString(url: 'url'): string;
}

declare module darksky {
  interface HourlyData {
    time: number
    icon: string
    temperature: number
    summary: string
  }

  interface DailyData {
    time: number
    icon: string
    temperatureHigh: number
    temperatureLow: number
  }

  interface Forecast<Type> {
    data: Type[]
  }

  interface Weather {
    currently: HourlyData

    daily: Forecast<DailyData>

    hourly: Forecast<HourlyData>
  }
}
