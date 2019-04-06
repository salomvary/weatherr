interface String {
  toString(url: 'url'): string;
}

declare module darksky {
  interface HourlyData {
    /** The UTC UNIX time in seconds at which this data point begins. */
    time: number
    icon: string
    temperature: number
    summary: string
  }

  interface DailyData {
    /** The UTC UNIX time in seconds at which this data point begins. */
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
