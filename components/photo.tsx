import React from "react";
import { motion } from "framer-motion";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { MapPin } from "lucide-react";

interface Destination {
  id: number;
  name: string;
  location: string;
  image: string;
}

const destinations: Destination[] = [
  {
    id: 1,
    name: "Taj Mahal Splendor",
    location: "Agra, Uttar Pradesh",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1000&h=700&q=80"
  },
  {
    id: 2,
    name: "Backwater Tranquility",
    location: "Kerala",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&h=700&q=80"
  },
  {
    id: 3,
    name: "Golden Temple Serenity",
    location: "Amritsar, Punjab",
    image: "https://images.unsplash.com/photo-1587899765642-3f8e3ea67852?q=80&w=1931&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    id: 4,
    name: "Mystic Varanasi",
    location: "Varanasi, Uttar Pradesh",
    image: "https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=1000&h=700&q=80"
  },
  {
    id: 5,
    name: "Majestic Rajasthan",
    location: "Jaipur, Rajasthan",
    image: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1000&h=700&q=80"
  },
  {
    id: 6,
    name: "Himalayan Serenity",
    location: "Darjeeling, West Bengal",
    image: "https://plus.unsplash.com/premium_photo-1697730484307-a05ad3449015?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  }
];

const PhotoGallery = () => {
  return (
    <>
      {/* Large screen carousel */}
      <div className="hidden md:block">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {destinations.map((destination) => (
              <CarouselItem key={destination.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <DestinationCard destination={destination} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-center mt-8">
            <CarouselPrevious className="relative static mx-2 bg-white/10 hover:bg-white/20 text-white border-white/20" />
            <CarouselNext className="relative static mx-2 bg-white/10 hover:bg-white/20 text-white border-white/20" />
          </div>
        </Carousel>
      </div>
      
      {/* Mobile grid view */}
      <div className="md:hidden grid grid-cols-1 gap-6">
        {destinations.slice(0, 4).map((destination) => (
          <DestinationCard key={destination.id} destination={destination} />
        ))}
      </div>
      
      {/* Floating elements for additional visual interest */}
      <motion.div
        className="hidden md:block absolute top-1/4 left-10 w-24 h-24 rounded-full bg-teal-500/20 blur-xl"
        animate={{
          y: [0, -15, 0],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="hidden md:block absolute bottom-1/3 right-20 w-32 h-32 rounded-full bg-purple-500/20 blur-xl"
        animate={{
          y: [0, 20, 0],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </>
  );
};

interface DestinationCardProps {
  destination: Destination;
}

const DestinationCard: React.FC<DestinationCardProps> = ({ destination }) => {
  return (
    <motion.div
      className="relative overflow-hidden rounded-xl group h-[350px]"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
    >
      {/* Image */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${destination.image})` }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="h-4 w-4 text-teal-400" />
            <p className="text-sm text-gray-300">{destination.location}</p>
          </div>
          <h3 className="text-xl font-bold mb-2">{destination.name}</h3>
          
          <motion.div
            className="h-0.5 w-0 bg-teal-400"
            whileInView={{ width: "30%" }}
            transition={{ delay: 0.3, duration: 0.6 }}
          />
          
          
        </motion.div>
      </div>
      
      {/* Hot spot indicator */}
      <motion.div
        className="absolute top-5 right-5 h-3 w-3 rounded-full bg-teal-400"
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <motion.div
          className="absolute inset-0 rounded-full bg-teal-400"
          animate={{ scale: [1, 2], opacity: [0.6, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </motion.div>
    </motion.div>
  );
};

export default PhotoGallery;