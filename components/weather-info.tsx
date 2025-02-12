"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface WeatherData {
  temperature: number
  condition: string
  humidity: number
}

interface WeatherInfoProps {
  date: string
}

export function WeatherInfo({ date }: WeatherInfoProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchWeather = async () => {
      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setWeather({
        temperature: 28,
        condition: "Partly cloudy",
        humidity: 70,
      })
    }

    fetchWeather()
  }, []) // Removed unnecessary dependency: date

  if (!weather) {
    return <div>Loading weather information...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weather Forecast for {date}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Temperature: {weather.temperature}°C</p>
        <p>Condition: {weather.condition}</p>
        <p>Humidity: {weather.humidity}%</p>
      </CardContent>
    </Card>
  )
}

