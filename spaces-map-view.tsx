import { useIsFocused } from '@react-navigation/core';
import { useDeepEffect } from 'common/hooks/use-deep-effect';
import {
  Booking,
  Coordinate,
  Nullable,
  Space,
  SpaceRating,
} from 'common/types';
import { MapAnnouncement } from 'common/types/map-announcement';
import { Reservation } from 'common/types/reservation';
import { ReservationModal } from 'features/reservation-modal';
import { ReservationConfirmation } from 'features/reservation-modal/reservation-confirmation';
import { SpaceLocationRouteParams } from 'features/space-location-modal/space-location-modal.screen';
import { useFilteredSpaces } from 'features/spaces-filter/spaces-filter/use-filtered-spaces';
import haversine from 'haversine';
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { callHapticFeedback, HapticType } from 'services/haptic';
import { analytics, events } from 'services/index';
import { findSpace } from 'utils/get/find-space';
import Theme from '../../themes/theme';
import { BottomMapActions } from './bottom-map-actions/bottom-map-actions.component';
import { EntryPassPill } from './entry-pass-pill/entry-pass-pill-view';
import { MapAnnouncmentView } from './map-announcment/map-announcment-view';
import { SpacePreview } from './space-preview';

interface SpacesMapViewProps {
  spaces: Space[];
  loading: boolean;
  currentLocation: Coordinate;
  activeBooking: Nullable<Booking>;
  notReviewedBooking: Nullable<Booking>;
  reservations: Reservation[];
  currentReservation: Nullable<Reservation>;
  selectedSpace: Nullable<Space>;
  isReservationModal: boolean;
  isReservationConfirmation: boolean;
  isFirstTimeUser: boolean;
  onDevMenuPress: () => void;
  onRefreshLocation: () => void;
  onSettingsMenuPress: () => void;
  onFilter: () => void;
  onMapAnnouncementPress: () => void;
  onSpacePreviewPress: (props: SpaceLocationRouteParams) => () => void;
  onSpacesListPress: () => void;
  mapAnnouncementDetails?: Nullable<MapAnnouncement>;
  onShowReviews: (selectedSpace: Nullable<Space>) => () => void;
  onToggleCheckInPass: (newBooking: Booking) => void;
  onToggleReservationModal: () => void;
  onReviewCheckInPillTapped: () => void;
  onViewReservationPillTapped: () => void;
  onToggleReservationConfirmation: () => void;
  setSelectedSpace: Dispatch<SetStateAction<Nullable<Space>>>;
  setCurrentReservation: Dispatch<SetStateAction<Nullable<Reservation>>>;
  locationPermissionStatus: Nullable<string>;
  onCheckInPress: () => void;
}

export interface ActiveMarkerProps {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  coordinate: Coordinate;
  rating: Nullable<SpaceRating>;
  price: Nullable<number>;
}

interface SpaceDistance {
  space: Space;
  distance: number;
}

const regionOffset = {
  latitudeDelta: 0.0622,
  longitudeDelta: 0.0121,
};

const coordinateFromSpace = (space: Space): Coordinate => ({
  longitude: space.longitude,
  latitude: space.latitude,
});

const SpacesMapView = ({
  spaces,
  currentLocation,
  isReservationModal,
  isReservationConfirmation,
  currentReservation,
  selectedSpace,
  onDevMenuPress,
  onRefreshLocation,
  loading,
  onSettingsMenuPress,
  onSpacesListPress,
  onSpacePreviewPress,
  onFilter,
  onMapAnnouncementPress,
  mapAnnouncementDetails,
  activeBooking,
  onShowReviews,
  notReviewedBooking,
  reservations,
  onToggleCheckInPass,
  onToggleReservationModal,
  onToggleReservationConfirmation,
  onReviewCheckInPillTapped,
  onViewReservationPillTapped,
  setSelectedSpace,
  setCurrentReservation,
  isFirstTimeUser,
  locationPermissionStatus,
  onCheckInPress,
}: SpacesMapViewProps) => {
  const mapRef = useRef<MapView>(null);
  const mapAnnouncmentRef = useRef(null);
  const bottomMapActionRef = useRef(null);

  const isFocused = useIsFocused();

  const findNearestMarker = (
    coordinate: Coordinate,
  ): Nullable<ActiveMarkerProps> => {
    const sortedSpaces = spaces
      .map<SpaceDistance>((s) => ({
        distance: haversine(coordinate, coordinateFromSpace(s)),
        space: s,
      }))
      .sort((a, b) => a.distance - b.distance);

    if (!sortedSpaces[0] || sortedSpaces[0].distance > 25) {
      return null;
    }

    const closestSpace = sortedSpaces[0].space;

    return {
      id: closestSpace.id,
      name: closestSpace.name,
      description: closestSpace.amenitiesLabel,
      imageUrl: closestSpace.images[0],
      coordinate: coordinateFromSpace(closestSpace),
      rating: closestSpace.rating,
      price: closestSpace.price,
    };
  };

  const [activeMarker, setActiveMarker] = useState<Nullable<ActiveMarkerProps>>(
    findNearestMarker(currentLocation),
  );

  const currentLocationRegion = {
    ...currentLocation,
    ...regionOffset,
  };

  const handleRegionChange = ({ longitude, latitude }: Region) => {
    const nearestMarker = findNearestMarker({ longitude, latitude });
    if (nearestMarker) {
      setSelectedSpace(findSpace(spaces, nearestMarker.id));
    }

    if (activeMarker?.id !== nearestMarker?.id) {
      callHapticFeedback(HapticType.SELECTION);
    }

    setActiveMarker(nearestMarker);
  };

  useEffect(() => {
    // anytime we refresh the location, we scroll to that position
    if (currentLocation && mapRef.current?.animateToRegion != null) {
      // There's some crazy behaviour with this and a test environment.
      // Unfortunately we can't test this because it leads to silently failing
      // tests
      if (process.env.NODE_ENV !== 'test') {
        mapRef.current.animateToRegion({
          ...currentLocation,
          ...regionOffset,
        });
      }
    }
  }, [currentLocation]);

  const spaceLocationModalProps = useMemo<
    Nullable<SpaceLocationRouteParams>
  >(() => {
    const activeSpace = activeMarker
      ? findSpace(spaces, activeMarker.id)
      : null;
    return activeSpace
      ? {
          space: activeSpace,
          currentLocation,
          coordinate: coordinateFromSpace(activeSpace),
          reservations,
          booking: activeBooking,
        }
      : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaces, activeMarker, currentLocation]);
  const { selectedFilters } = useFilteredSpaces();

  useEffect(() => {
    handleRegionChange(currentLocationRegion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilters]);

  const onCheckinPillTapped = () => {
    if (!activeBooking) return;
    const bookedSpaces = findSpace(spaces, activeBooking.spaceId);
    setSelectedSpace(bookedSpaces);
    analytics.event(events.viewedEntryPass, {
      'Location Name': activeBooking.title,
      'App Location': 'Map View Tile',
    });
    onToggleCheckInPass(activeBooking);
  };

  const onReservationConfirmationPillTapped = () => {
    if (!reservations) return;
    const reservedSpace = findSpace(spaces, reservations[0].spaceId);
    setSelectedSpace(reservedSpace);
    setCurrentReservation(reservations[0]);
    onToggleReservationConfirmation();
  };

  const [mapWidth, setWidth] = useState(Dimensions.get('window').width + 1);
  const [mapPadding] = useState({ bottom: 55, top: 0, right: 0, left: 0 });
  const [elementsHeight, setElementsHeight] = useState({
    mapAnnouncment: 0,
    bottomMapAction: 0,
    defaultMargin: Theme.spacing[5],
  });
  const [legalLabelInsets, setLegalLabelInsets] = useState({
    bottom: 120,
    right: Theme.spacing[8],
    left: 0,
    top: 0,
  });

  const setHeight = useCallback(
    (elementName: 'mapAnnouncment' | 'bottomMapAction') => (
      ox: number,
      oy: number,
      width: number,
      height: number,
    ) => {
      setElementsHeight({ ...elementsHeight, [elementName]: height });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (mapAnnouncmentRef && mapAnnouncmentRef.current) {
      // @ts-ignore
      mapAnnouncmentRef.current.measure(setHeight('mapAnnouncment'));
    }
    if (bottomMapActionRef && bottomMapActionRef.current) {
      // @ts-ignore
      bottomMapActionRef.current.measure(setHeight('bottomMapAction'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapAnnouncmentRef.current, bottomMapActionRef.current]);

  useDeepEffect(() => {
    setLegalLabelInsets({
      ...legalLabelInsets,
      bottom:
        elementsHeight.bottomMapAction +
        elementsHeight.mapAnnouncment +
        elementsHeight.defaultMargin,
    });
  }, [elementsHeight]);

  return (
    <>
      <View style={styles.parentContainer} testID="MAP_CONTAINER">
        <MapView
          ref={mapRef}
          showsUserLocation={locationPermissionStatus === 'granted'}
          style={[styles.map, { width: mapWidth }]}
          initialRegion={currentLocationRegion}
          onRegionChange={handleRegionChange}
          onMapReady={() => setWidth(mapWidth - 1)}
          mapPadding={mapPadding}
          showsCompass={false}
          showsMyLocationButton={false}
          legalLabelInsets={legalLabelInsets}
        >
          {spaces.map((s) => (
            <Marker
              key={s.id}
              coordinate={{ longitude: s.longitude, latitude: s.latitude }}
            >
              {s.id === activeMarker?.id ? (
                <Image
                  resizeMode="contain"
                  source={require('../../assets/icons/pin_selected.png')}
                  style={styles.pin}
                />
              ) : (
                <Image
                  resizeMode="contain"
                  source={require('../../assets/icons/pin.png')}
                  style={styles.pin}
                />
              )}
            </Marker>
          ))}
        </MapView>
        {loading && <ActivityIndicator />}
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            {activeMarker && (
              <EntryPassPill
                booking={activeBooking}
                notReviewedBooking={notReviewedBooking}
                reservation={reservations ? reservations[0] : undefined}
                onReservationConfirmationPress={
                  onReservationConfirmationPillTapped
                }
                onReviewCheckInPass={onReviewCheckInPillTapped}
                onViewCheckInPass={onCheckinPillTapped}
                onViewReservationPassPress={onViewReservationPillTapped}
              />
            )}

            <View style={styles.shadow}>
              {selectedSpace && (
                <SpacePreview
                  space={selectedSpace}
                  isFirstTimeUser={isFirstTimeUser}
                  onCheckIn={onCheckInPress}
                  onShowReviews={onShowReviews(selectedSpace)}
                  onSpacePreviewPress={onSpacePreviewPress(
                    spaceLocationModalProps!,
                  )}
                />
              )}
            </View>
          </View>
          {selectedSpace && currentReservation && (
            <ReservationConfirmation
              isVisible={isReservationConfirmation && isFocused}
              spaceName={selectedSpace.name}
              address={selectedSpace.address}
              reservation={currentReservation}
              timings={selectedSpace.timings}
              onToggleCheckInPass={onToggleCheckInPass}
              onDismiss={onToggleReservationConfirmation}
            />
          )}
          {selectedSpace && isReservationModal && (
            <ReservationModal
              space={selectedSpace}
              isVisible={isReservationModal && isFocused}
              reservations={reservations}
              booking={activeBooking}
              onDismiss={onToggleReservationModal}
              appLocation="map view"
            />
          )}
        </SafeAreaView>

        <BottomMapActions
          bottomMapActionsRef={bottomMapActionRef}
          onRefreshLocation={onRefreshLocation}
          onDevMenuPress={onDevMenuPress}
          onFilter={onFilter}
          onSettingsMenuPress={onSettingsMenuPress}
          selectedFilters={selectedFilters}
          onSpacesListPress={onSpacesListPress}
        />
      </View>
      {mapAnnouncementDetails && (
        <MapAnnouncmentView
          mapAnnouncmentRef={mapAnnouncmentRef}
          details={mapAnnouncementDetails}
          onPress={onMapAnnouncementPress}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  parentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  shadow: {
    shadowRadius: 10,
    shadowOpacity: Theme.opacity[25],
    shadowOffset: {
      width: 10,
      height: 10,
    },
  },
  safeArea: {
    position: 'absolute',
    top: 0,
  },
  container: {
    paddingTop: Theme.spacing[5],
  },
  activeBooking: {
    backgroundColor: Theme.colors.green[500],
    padding: Theme.spacing[6],
    marginBottom: Theme.spacing[5],
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: Theme.borderRadius.default,
  },
  activeBookingText: {
    color: Theme.colors.white,
    marginRight: Theme.spacing[5],
  },
  activeBookingAccessory: {
    color: Theme.colors.white,
  },
  activeBookingInformation: {
    flexDirection: 'row',
  },
  bottomContainer: {
    bottom: 0,
    width: '100%',
    marginBottom: Theme.spacing['5'],
    marginHorizontal: Theme.spacing['6'],
  },
  rightButtonsContainer: {
    alignItems: 'center',
    right: 0,
    bottom: 0,
    position: 'absolute',
    marginHorizontal: Theme.spacing['6'],
    marginBottom: Theme.spacing['5'],
  },
  leftButtonsContainer: {
    left: 0,
    bottom: 0,
    position: 'absolute',
    marginHorizontal: Theme.spacing['6'],
    marginBottom: Theme.spacing['5'],
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconDefault: {
    fontSize: 45,
  },
  locateButton: {
    alignSelf: 'center',
  },
  spacesFilterButton: {
    alignSelf: 'center',
  },
  intercomButton: {
    backgroundColor: Theme.colors.primary,
  },
  buttonIconButton: {
    marginLeft: Theme.spacing['5'],
  },
  pin: {
    height: 40,
    width: 40,
  },
});

export default SpacesMapView;
