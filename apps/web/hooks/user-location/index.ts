import { useState } from "react";

export type UserLocation = { latitude: number; longitude: number };

export const useUserLocation = () => {
  const [userLocation, setUserLocation] = useState<UserLocation>();
  const [isLocating, setIsLocating] = useState(false);
  const [locationErrorMessage, setLocationErrorMessage] = useState<string>();

  const locateWithBrowser = () => {
    if (!navigator.geolocation) {
      setLocationErrorMessage("This browser cannot find your location. Tap the map to set where you are.");
      return;
    }
    setIsLocating(true);
    setLocationErrorMessage(undefined);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setIsLocating(false);
      },
      () => {
        setLocationErrorMessage("We cannot read your location. Tap the map to set where you are.");
        setIsLocating(false);
      },
    );
  };

  const chooseLocation = (chosenLocation: UserLocation) => {
    setLocationErrorMessage(undefined);
    setUserLocation(chosenLocation);
  };

  return { userLocation, isLocating, locationErrorMessage, locateWithBrowser, chooseLocation };
};
