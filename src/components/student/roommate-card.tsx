"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Users, Wifi, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface RoommateCardProps {
  id: string;
  title: string;
  price: number;
  address: string;
  imageUrl: string;
  peopleLookingFor: number;
  currentRoommates: number;
  amenities: string[];
  isVerified?: boolean;
}

export function RoommateCard({
  id,
  title,
  price,
  address,
  imageUrl,
  peopleLookingFor,
  currentRoommates,
  amenities,
  isVerified,
}: RoommateCardProps) {
  return (
    <Link href={`/student-living/${id}`} className="group block">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
        {/* Image */}
        <div className="relative h-[180px] w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {isVerified && (
            <Badge className="absolute left-3 top-3 gap-1 bg-kaza-green text-white">
              <Shield className="size-3" />
              Vérifié
            </Badge>
          )}
          <div className="absolute bottom-3 right-3 rounded-lg bg-kaza-blue px-3 py-1.5 text-sm font-semibold text-white">
            {formatPrice(price)}
            <span className="text-xs font-normal opacity-80">/mois</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="mb-1 line-clamp-1 text-base font-semibold">
            {title}
          </h3>
          <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            <span className="line-clamp-1">{address}</span>
          </div>

          <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="size-3.5" />
            <span>
              {currentRoommates} colocataire{currentRoommates > 1 ? "s" : ""} ·
              Cherche {peopleLookingFor} personne{peopleLookingFor > 1 ? "s" : ""}
            </span>
          </div>

          {/* Amenities */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {amenities.slice(0, 3).map((amenity) => (
              <Badge key={amenity} variant="secondary" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {amenities.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{amenities.length - 3}
              </Badge>
            )}
          </div>

          <Button size="sm" className="w-full">
            Demander à rejoindre
          </Button>
        </div>
      </div>
    </Link>
  );
}
