"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { TravelPlanForm } from "@/components/travel-plan-form";
import { ItineraryList } from "@/components/itinerary-list";
import { Header } from "@/components/header";
import { MapPin, Star, Cloud, Route, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Itinerary } from "@/types/itinerary";

export default function Dashboard() {
  const { user } = useAuth();
  const [generatedItineraries, setGeneratedItineraries] = useState<Itinerary[]>([]);
  const [savedItineraries, setSavedItineraries] = useState<any[]>([]);
  const [recommendedItineraries, setRecommendedItineraries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log("User data received in Dashboard:", user);
    if (user === undefined) return; // Wait for user data to load
    if (!user) {
      console.warn("User not found, redirecting to login...");
      router.push("/");
    } else {
      // Fetch saved itineraries when user data is available
      fetchSavedItineraries();
      // Fetch recommended itineraries from Excel
      fetchRecommendedItineraries();
    }
  }, [user, router]);

  // Handle newly generated itineraries
  const handleItinerariesGenerated = (newItineraries: Itinerary[]) => {
    setGeneratedItineraries(newItineraries);
  };

  // Function to fetch saved itineraries
  const fetchSavedItineraries = async () => {
    if (!user || !user._id) return;
    
    try {
      setIsLoading(true);
      console.log("Fetching saved itineraries for user:", user._id);
      
      const response = await fetch(`/api/display_saved?userId=${user._id}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Saved itineraries retrieved:", data.itineraries);
      setSavedItineraries(data.itineraries);
    } catch (error) {
      console.error("Failed to fetch saved itineraries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch recommended itineraries from Excel
  const fetchRecommendedItineraries = async () => {
    if (!user || !user._id) return;
    
    try {
      setIsLoadingRecommendations(true);
      console.log("Fetching recommended itineraries for user:", user._id);
      
      const response = await fetch(`/api/recommended_itineraries?userId=${user._id}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Recommended itineraries retrieved:", data.recommendations);
      setRecommendedItineraries(data.recommendations);
    } catch (error) {
      console.error("Failed to fetch recommended itineraries:", error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // Function to handle rating an itinerary
  const rateItinerary = async (itineraryText) => {
    try {
      // Show rating modal
      const rating = await showRatingModal();
      
      if (!rating) return; // User canceled the rating
      
      // Get current user ID
      const userId = user._id;
      
      // Send rating to the server
      const response = await fetch('/api/rate_itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itineraryText,
          userId,
          rating
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const result = await response.json();
      alert('Thank you for rating this itinerary!');
      console.log('Rating submitted:', result);
      
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    }
  };

  // Function to save a recommended itinerary
  const saveRecommendedItinerary = async (itineraryText) => {
    if (!user?._id) {
      console.error("❌ Error: User ID is missing.");
      return;
    }
  
    try {
      const response = await fetch('/api/save_itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          itineraryText, // Updated key name to match the API
        }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        console.error(`❌ Server Error (${response.status}):`, result);
        throw new Error(result.error || `Server responded with status ${response.status}`);
      }
  
      alert('✅ Itinerary saved successfully!');
      console.log('📜 Itinerary saved:', result);
  
      // Refresh saved itineraries
      fetchSavedItineraries();
      
    } catch (error) {
      console.error('❌ Error saving itinerary:', error);
      alert('⚠️ Failed to save itinerary. Please try again.');
    }
  };
  

  // Helper function to show a rating modal
  const showRatingModal = () => {
    return new Promise((resolve) => {
      // Create modal container
      const modalContainer = document.createElement('div');
      modalContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in';
      
      // Create modal content
      modalContainer.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-xl max-w-md w-full animate-scale-up">
          <h2 class="text-xl font-bold mb-4 text-teal-700">Rate This Itinerary</h2>
          <p class="mb-4 text-gray-600">How would you rate this travel plan?</p>
          <div class="flex justify-center space-x-3 mb-6">
            ${[1, 2, 3, 4, 5].map(num => 
              `<button class="rating-btn w-12 h-12 rounded-full border-2 border-teal-300 hover:bg-teal-50 hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200" data-rating="${num}">${num}</button>`
            ).join('')}
          </div>
          <div class="flex justify-end space-x-4">
            <button class="cancel-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      `;
      
      // Add to DOM
      document.body.appendChild(modalContainer);
      
      // Add event listeners
      const ratingButtons = modalContainer.querySelectorAll('.rating-btn');
      ratingButtons.forEach(button => {
        button.addEventListener('click', () => {
          const rating = parseInt(button.getAttribute('data-rating'));
          document.body.removeChild(modalContainer);
          resolve(rating);
        });
      });
      
      // Cancel button
      const cancelButton = modalContainer.querySelector('.cancel-btn');
      cancelButton.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
        resolve(null);
      });
      
      // Close on outside click
      modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
          document.body.removeChild(modalContainer);
          resolve(null);
        }
      });
    });
  };

  // Placeholder functions for other features
  const getWeather = async (itineraryText: string) => {
    // API key - replace with your actual OpenWeatherMap API key
    const API_KEY = 'f0b6214eef841c7df38b1d12c375c1e8';
  
    // Function to extract specific locations
    const extractLocations = (text: string): string[] => {
      const locations = [];
      const locationRegexes = [
        /\b(Goa)\b/i,
        /\b(Ladakh)\b/i,
        /\b(Leh)\b/i
      ];
  
      locationRegexes.forEach(regex => {
        const match = text.match(regex);
        if (match) {
          locations.push(match[1]);
        }
      });
  
      return locations;
    };
  
    // Extract locations from itinerary
    const locations = extractLocations(itineraryText);
  
    if (locations.length === 0) {
      alert('No specific locations found for weather forecast.');
      return;
    }
  
    try {
      const forecastPromises = locations.map(async (location) => {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${API_KEY}&units=metric`
        );
  
        if (!response.ok) {
          throw new Error(`Forecast data not available for ${location}`);
        }
  
        const data = await response.json();
        
        // Group forecast by day (taking the forecast for midday each day)
        const dailyForecasts = data.list.reduce((acc, forecast) => {
          const date = new Date(forecast.dt * 1000);
          const dateKey = date.toISOString().split('T')[0];
          
          // Select forecasts around midday (11:00-14:00)
          if (date.getUTCHours() >= 11 && date.getUTCHours() <= 14) {
            if (!acc[dateKey]) {
              acc[dateKey] = {
                date: dateKey,
                temperature: forecast.main.temp,
                description: forecast.weather[0].description,
                humidity: forecast.main.humidity,
                windSpeed: forecast.wind.speed,
                icon: forecast.weather[0].icon
              };
            }
          }
          
          return acc;
        }, {});
  
        // Convert to array and limit to 4 days
        const forecastArray = Object.values(dailyForecasts)
          .slice(0, 4)
          .map(day => ({
            ...day,
            formattedDate: new Date(day.date).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })
          }));
  
        return {
          location: location,
          forecasts: forecastArray
        };
      });
  
      const forecastResults = await Promise.all(forecastPromises);
  
      // Create a modal to display forecast information
      const modalContainer = document.createElement('div');
      modalContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      
      modalContainer.innerHTML = `
        <div class="bg-white p-6 rounded-lg max-w-md w-full">
          <h2 class="text-2xl font-bold mb-4">4-Day Weather Forecast</h2>
          ${forecastResults.map(result => `
            <div class="mb-4 p-4 border rounded">
              <h3 class="font-semibold text-lg">${result.location}</h3>
              ${result.forecasts.map(day => `
                <div class="flex items-center justify-between border-b py-2">
                  <span class="font-medium">${day.formattedDate}</span>
                  <img 
                    src="https://openweathermap.org/img/wn/${day.icon}@2x.png" 
                    alt="Weather icon" 
                    class="w-12 h-12"
                  />
                  <div>
                    <p>🌡️ ${day.temperature.toFixed(1)}°C</p>
                    <p>☁️ ${day.description}</p>
                    <p>💧 Humidity: ${day.humidity}%</p>
                    <p>💨 Wind: ${day.windSpeed.toFixed(1)} m/s</p>
                  </div>
                </div>
              `).join('')}
            </div>
          `).join('')}
          <button class="close-btn px-4 py-2 bg-black text-white rounded-lg mt-4">Close</button>
        </div>
      `;
  
      document.body.appendChild(modalContainer);
  
      // Add close button functionality
      const closeButton = modalContainer.querySelector('.close-btn');
      closeButton.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
      });
  
      // Close on outside click
      modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
          document.body.removeChild(modalContainer);
        }
      });
  
    } catch (error) {
      console.error('Forecast fetch error:', error);
      alert('Failed to fetch weather forecast. Please try again.');
    }
  };

  const getTripRoute = async (itineraryText: string) => {
    // OpenRouteService API key (free tier)
    const ORS_API_KEY = '5b3ce3597851110001cf62485d2496f98a1c4b1f89b71df05760b43c';

    // Detailed Goa locations with coordinates
    const goaLocations = {
        // North Goa Locations
        'Aguada Fort': { name: 'Aguada Fort', coordinates: [73.7683, 15.5049] },
        'Baga Beach': { name: 'Baga Beach', coordinates: [73.7518, 15.5580] },
        'Candolim Beach': { name: 'Candolim Beach', coordinates: [73.7615, 15.5110] },
        'Calangute Beach': { name: 'Calangute Beach', coordinates: [73.7518, 15.5465] },
        'Arambol Beach': { name: 'Arambol Beach', coordinates: [73.6878, 15.6528] },
        'Museum of Goa': { name: 'Museum of Goa', coordinates: [73.7725, 15.5056] },
        'Chapora Fort': { name: 'Chapora Fort', coordinates: [73.6948, 15.6095] },
        
        // Panaji Locations
        'Reis Magos Fort': { name: 'Reis Magos Fort', coordinates: [73.8047, 15.5057] },
        'Basilica of Bom Jesus': { name: 'Basilica of Bom Jesus', coordinates: [73.9118, 15.5007] },
        'Immaculate Conception Church': { name: 'Immaculate Conception Church', coordinates: [73.8312, 15.4989] },
        'Miramar Beach': { name: 'Miramar Beach', coordinates: [73.8312, 15.4680] },
        'Dona Paula': { name: 'Dona Paula', coordinates: [73.8009, 15.4630] },
        
        // South Goa Locations
        'Indian Naval Aviation Museum': { name: 'Indian Naval Aviation Museum', coordinates: [73.8313, 15.2993] },
        'Majorda Beach': { name: 'Majorda Beach', coordinates: [73.8401, 15.2793] },
        'Colva Beach': { name: 'Colva Beach', coordinates: [73.9119, 15.2767] },
        'Cabo De Rama Fort': { name: 'Cabo De Rama Fort', coordinates: [73.9447, 15.1088] }
    };

    // Function to extract locations mentioned in the text
    const extractLocations = (text: string) => {
        const foundLocations = [];
        for (const [locationName, locationData] of Object.entries(goaLocations)) {
            const regex = new RegExp(`\\b(${locationName})\\b`, 'i');
            if (regex.test(text)) {
                foundLocations.push(locationData);
            }
        }
        return foundLocations;
    };

    // Haversine formula for distance calculation
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // Traveling Salesman Problem solver using nearest neighbor algorithm
    const solveTSP = (locations) => {
        if (locations.length <= 1) return locations;

        const unvisited = [...locations];
        const route = [unvisited.shift()];

        while (unvisited.length > 0) {
            const lastLocation = route[route.length - 1];
            let nearestLocation = null;
            let minDistance = Infinity;

            for (const location of unvisited) {
                const distance = calculateDistance(
                    lastLocation.coordinates[1], 
                    lastLocation.coordinates[0], 
                    location.coordinates[1], 
                    location.coordinates[0]
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    nearestLocation = location;
                }
            }

            route.push(nearestLocation);
            unvisited.splice(unvisited.indexOf(nearestLocation), 1);
        }

        return route;
    };

    // Function to get route between two points with geometry
    const getRoutesBetweenPoints = async (locations) => {
        const routes = [];
        const geometries = [];

        for (let i = 0; i < locations.length - 1; i++) {
            try {
                const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json, application/geo+json',
                        'Content-Type': 'application/json',
                        'Authorization': ORS_API_KEY
                    },
                    body: JSON.stringify({
                        coordinates: [
                            locations[i].coordinates,
                            locations[i+1].coordinates
                        ]
                    })
                });

                if (!response.ok) {
                    throw new Error(`Routing failed between ${locations[i].name} and ${locations[i+1].name}`);
                }

                const routeData = await response.json();
                
                // Extract route summary
                const feature = routeData.features[0];
                const distance = feature.properties.summary.distance / 1000; // Convert to kilometers
                const duration = feature.properties.summary.duration / 3600; // Convert to hours
                
                // Extract geometry
                const routeGeometry = feature.geometry.coordinates;
                
                routes.push({
                    start: locations[i].name,
                    end: locations[i+1].name,
                    distance: distance,
                    duration: duration
                });
                
                geometries.push(routeGeometry);
            } catch (error) {
                console.error('Route fetch error:', error);
            }
        }

        return { routes, geometries };
    };

    try {
        // Extract locations from the itinerary
        const locations = extractLocations(itineraryText);

        if (locations.length === 0) {
            alert('No specific locations found in the itinerary.');
            return;
        }

        // Solve TSP to get optimized route
        const optimizedRoute = solveTSP(locations);

        // Get detailed routes between points with geometry
        const { routes: routeDetails, geometries } = await getRoutesBetweenPoints(optimizedRoute);

        // Calculate total distance and duration
        const totalDistance = routeDetails.reduce((sum, route) => sum + route.distance, 0);
        const totalDuration = routeDetails.reduce((sum, route) => sum + route.duration, 0);

        // Create modal to display route information with map
        const modalContainer = document.createElement('div');
        modalContainer.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        modalContainer.innerHTML = `
            <div class="bg-white p-6 rounded-lg max-w-4xl w-full h-5/6 flex flex-col">
                <h2 class="text-2xl font-bold mb-2">Optimized Goa Trip Route</h2>
                
                <div class="flex flex-row h-full space-x-4">
                    <!-- Map container -->
                    <div id="map-container" class="w-2/3 h-full rounded border"></div>
                    
                    <!-- Route details -->
                    <div class="w-1/3 flex flex-col overflow-auto">
                        <div class="mb-4">
                            <h3 class="font-semibold text-lg">Route Details</h3>
                            <div id="route-details" class="space-y-2 overflow-y-auto max-h-96">
                                ${routeDetails.map(route => `
                                    <div class="border-b py-2">
                                        <p>📍 ${route.start} → ${route.end}</p>
                                        <p>📏 Distance: ${route.distance.toFixed(1)} km</p>
                                        <p>⏱️ Duration: ${route.duration.toFixed(1)} hours</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="mt-auto">
                            <h3 class="font-semibold text-lg">Trip Summary</h3>
                            <p>📏 Total Distance: ${totalDistance.toFixed(1)} km</p>
                            <p>⏱️ Total Duration: ${totalDuration.toFixed(1)} hours</p>
                        </div>
                    </div>
                </div>
                
                <button class="close-btn px-4 py-2 bg-black text-white rounded-lg mt-4 self-end">Close</button>
            </div>
        `;

        document.body.appendChild(modalContainer);

        // Initialize Leaflet map after modal is added to DOM
        setTimeout(() => {
            // Create map
            const mapContainer = document.getElementById('map-container');
            
            // Add Leaflet CSS
            const leafletCSS = document.createElement('link');
            leafletCSS.rel = 'stylesheet';
            leafletCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
            document.head.appendChild(leafletCSS);
            
            // Add Leaflet JS
            const leafletScript = document.createElement('script');
            leafletScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
            leafletScript.onload = () => {
                // Now we can use L (Leaflet)
                const map = L.map(mapContainer).setView([15.4, 73.8], 10); // Center on Goa
                
                // Add the base map layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(map);
                
                // Add markers for each location
                optimizedRoute.forEach((location, index) => {
                    const markerColor = index === 0 ? 'green' : (index === optimizedRoute.length - 1 ? 'red' : 'blue');
                    
                    // Create custom icon
                    const icon = L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
                        iconSize: [12, 12],
                        iconAnchor: [6, 6]
                    });
                    
                    // Add marker with popup
                    L.marker([location.coordinates[1], location.coordinates[0]], { icon })
                        .addTo(map)
                        .bindPopup(`<b>${index + 1}. ${location.name}</b>`);
                });
                
                // Add route lines in blue
                geometries.forEach(routePoints => {
                    const latLngs = routePoints.map(point => [point[1], point[0]]);
                    L.polyline(latLngs, {
                        color: '#0066CC',
                        weight: 4,
                        opacity: 0.8
                    }).addTo(map);
                });
                
                // Fit map to show all points
                const bounds = optimizedRoute.map(loc => [loc.coordinates[1], loc.coordinates[0]]);
                map.fitBounds(bounds);
            };
            document.body.appendChild(leafletScript);
        }, 100);

        // Add close button functionality
        const closeButton = modalContainer.querySelector('.close-btn');
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modalContainer);
        });

        // Close on outside click
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                document.body.removeChild(modalContainer);
            }
        });

    } catch (error) {
        console.error('Goa route error:', error);
        alert('Failed to generate Goa trip route. Please try again.');
    }
};

const getBackgroundImage = (itinerary, index) => {
  const places = ["goa", "leh", "delhi", "mumbai", "manali", "jaipur", "kerala", "varanasi", "shimla"];
  const lowerItinerary = itinerary.toLowerCase();
  const matchedPlace = places.find(place => lowerItinerary.includes(place));
  return matchedPlace ? `/images/${matchedPlace}.jpg` : `/api/placeholder/600/${320 + (index * 15)}`;
};
  
if (!user || !user._id) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-teal-white">
      <div className="text-center animate-pulse-soft">
        <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
        <p className="text-lg text-teal-700">Loading your personalized travel dashboard...</p>
      </div>
    </div>
  );
}

return (
  <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
    <Header />
    <div className="w-full h-64 md:h-80 relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center"></div>
      <div className="absolute inset-0 bg-travel-teal-dark/30"></div>
      <div className="container mx-auto h-full flex items-center px-4 relative z-10">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-travel-teal animate-fade-in drop-shadow-lg">
            Welcome, <span className="text-travel-azure">{user.name || "Traveler"}</span>!
          </h1>
          <p className="text-travel-teal mb-8 opacity-90 max-w-xl text-lg drop-shadow-md">
            Create your perfect journey with personalized travel plans tailored just for you
          </p>
        </div>
      </div>
    </div>
    
    <main className="flex-grow container mx-auto px-4 py-8 animate-fade-in -mt-16 relative z-20">
      <div className="mb-16 text-center sm:text-left">
        <div className="itinerary-card p-6 animate-scale-up border border-gray-200 rounded-lg shadow-lg bg-white backdrop-blur-md">
          <TravelPlanForm onItinerariesGenerated={handleItinerariesGenerated} />
        </div>
      </div>
      
      {generatedItineraries.length > 0 && (
        <div className="mb-16 animate-fade-in">
          <div className="flex items-center mb-8">
            <span className="w-2 h-8 bg-travel-teal rounded-full mr-3"></span>
            <h2 className="text-2xl font-bold text-travel-teal-dark flex items-center">
              Generated Itineraries
              <span className="ml-3 bg-travel-teal/10 text-travel-teal text-sm py-1 px-3 rounded-full">Just for you</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedItineraries.map((item, index) => (
              <div key={index} className="itinerary-card animate-scale-up border-2 border-travel-teal rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden" style={{animationDelay: `${index * 100}ms`}}>
                <div className="h-40 relative">
                  <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url('${getBackgroundImage(item.description, index)}')`}}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-4">
                    <span className="inline-block bg-travel-teal text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Custom Itinerary #{index + 1}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="whitespace-pre-wrap mb-4 text-gray-700 max-h-48 overflow-y-auto">{item.itinerary}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mb-16 animate-fade-in animation-delay-200">
        <div className="flex items-center mb-8">
          <span className="w-2 h-8 bg-travel-azure rounded-full mr-3"></span>
          <h2 className="text-2xl font-bold text-travel-teal-dark flex items-center">
            Recommended For You
            <span className="ml-3 bg-travel-azure/20 text-travel-teal-dark text-sm py-1 px-3 rounded-full">Trending Destinations</span>
          </h2>
        </div>
        
        {isLoadingRecommendations ? (
          <div className="flex items-center justify-center p-12 border border-gray-200 rounded-lg bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-travel-teal mr-2" />
            <p className="text-travel-teal-dark">Discovering perfect trips for you...</p>
          </div>
        ) : recommendedItineraries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedItineraries.map((item, index) => (
              <div key={index} className="recommended-card animate-scale-up border-2 border-travel-azure rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden" style={{animationDelay: `${index * 100}ms`}}>
                <div className="h-40 relative">
                  <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url('${getBackgroundImage(item.itinerary, index)}')`}}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute top-0 right-0 p-3">
                    {item.matchScore && (
                      <span className="text-sm font-medium bg-white text-travel-teal-dark px-2 py-1 rounded-full flex items-center shadow-md">
                        <Star className="h-3 w-3 mr-1 text-travel-teal" fill="currentColor" /> 
                        {Math.round(item.matchScore * 100)}% match
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 p-4">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full text-white ${item.isGeneric ? 'bg-travel-azure' : 'bg-travel-teal'}`}>
                      {item.isGeneric ? 'Curated Trip' : 'Personalized for You'}
                    </span>
                  </div>
                </div>
                <div className="p-6 bg-white">
                  <div className="whitespace-pre-wrap mb-4 text-gray-700 max-h-48 overflow-y-auto">{item.itinerary}</div>
                  <div className="mt-4">
                    <button 
                      className="teal-button w-full flex items-center justify-center"
                      onClick={() => saveRecommendedItinerary(item.itinerary)}
                    >
                      <Save className="h-4 w-4 mr-2" /> Save to My Itineraries
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="itinerary-card p-8 text-center border border-gray-200 rounded-lg bg-white bg-[url('/api/placeholder/800/200')] bg-opacity-10 bg-blend-overlay">
            <div className="py-8">
              <p className="text-gray-600 mb-4">No recommendations available yet. Continue using the platform to get personalized suggestions!</p>
          
            </div>
          </div>
        )}
      </div>
      
      <div className="mb-12 animate-fade-in animation-delay-300">
        <div className="flex items-center mb-8">
          <span className="w-2 h-8 bg-travel-teal-dark rounded-full mr-3"></span>
          <h2 className="text-2xl font-bold text-travel-teal-dark flex items-center">
            Your Saved Itineraries
            <span className="ml-3 bg-travel-teal-dark/10 text-travel-teal-dark text-sm py-1 px-3 rounded-full">Ready to explore</span>
          </h2>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-12 border border-gray-200 rounded-lg bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-travel-teal mr-2" />
            <p className="text-travel-teal-dark">Loading your travel collection...</p>
          </div>
        ) : savedItineraries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedItineraries.map((item, index) => (
              <div key={index} className="itinerary-card animate-scale-up border-2 border-travel-teal-dark rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden" style={{animationDelay: `${index * 100}ms`}}>
                <div className="h-40 relative">
                  <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url('${getBackgroundImage(item.itinerary, index)}')`}}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center bg-white/90 backdrop-blur-sm text-travel-teal-dark text-xs font-medium px-2 py-1 rounded-full">
                      <MapPin className="h-3 w-3 mr-1 text-travel-teal" /> Saved Trip
                    </span>
                  </div>
                </div>
                <div className="p-6 bg-white">
                  <div className="whitespace-pre-wrap mb-5 text-gray-700 max-h-48 overflow-y-auto">{item.itinerary}</div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <button 
                      className="col-span-1 teal-button-outline flex items-center justify-center text-sm py-2 px-1 border border-travel-teal rounded-md hover:bg-travel-teal/5 transition-colors" 
                      onClick={() => rateItinerary(item.itinerary)}
                    >
                      <Star className="h-4 w-4 mr-1" /> Rate
                    </button>
                    <button 
                      className="col-span-1 teal-button-outline flex items-center justify-center text-sm py-2 px-1 border border-travel-teal rounded-md hover:bg-travel-teal/5 transition-colors" 
                      onClick={() => getWeather(item.itinerary)}
                    >
                      <Cloud className="h-4 w-4 mr-1" /> Weather
                    </button>
                    <button 
                      className="col-span-1 teal-button-outline flex items-center justify-center text-sm py-2 px-1 border border-travel-teal rounded-md hover:bg-travel-teal/5 transition-colors" 
                      onClick={() => getTripRoute(item.itinerary)}
                    >
                      <MapPin className="h-4 w-4 mr-1" /> Route
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-gray-200 rounded-lg bg-white bg-[url('/api/placeholder/800/200')] bg-opacity-10 bg-blend-overlay">
            <div className="py-8">
              <p className="text-gray-600 mb-4">No saved itineraries yet. Create and save some travel plans to see them here!</p>
              
            </div>
          </div>
        )}
      </div>
      
    </main>
    
    <div className="bg-travel-teal-dark/10 py-6">
      <div className="container mx-auto px-4">
        <p className="text-center text-travel-teal-dark/60 text-sm">© 2025 JourneyGenie | Create memories that last a lifetime</p>
      </div>
    </div>
  </div>
  );
}