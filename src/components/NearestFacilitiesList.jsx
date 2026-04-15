
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Hospital, Syringe, Stethoscope, Navigation } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const typeIcons = {
    hospital: <Hospital className="w-5 h-5 text-red-500" />,
    clinic: <Stethoscope className="w-5 h-5 text-blue-500" />,
    medical: <Syringe className="w-5 h-5 text-green-500" />,
};

export default function NearestFacilitiesList({ facilities, onFacilitySelect, userLocation }) {

    const getDirectionsUrl = (facility) => {
        if (!userLocation) return '#';
        return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${facility.lat},${facility.lng}`;
    }

    if (!userLocation || facilities.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Nearby Facilities</CardTitle>
                </CardHeader>
                <CardContent>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-2">
                            <Skeleton circle width={40} height={40} />
                            <div className="flex-1 space-y-2">
                                <Skeleton width="75%" height={16} />
                                <Skeleton width="50%" height={12} />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Nearest Facilities</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
                <ScrollArea className="h-full">
                    <div className="divide-y">
                        {facilities.map(facility => (
                            <div key={facility.id} className="p-3 hover:bg-muted/50 cursor-pointer flex items-start gap-4" onClick={() => onFacilitySelect(facility)}>
                                <div className="mt-1">
                                    {typeIcons[facility.type]}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold">{facility.name}</h4>
                                    <p className="text-sm text-muted-foreground">{facility.location}</p>
                                    {'distance' in facility && typeof facility.distance === 'number' && (
                                        <p className="text-sm font-medium text-primary">
                                            {facility.distance.toFixed(2)} km away
                                        </p>
                                    )}
                                </div>
                                <a href={getDirectionsUrl(facility)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title="Get Directions">
                                    <Navigation className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                                </a>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
