import { NavigationProp, useNavigation } from '@react-navigation/core';
import { Button, Text } from 'common/components';
import { BottomSheet } from 'common/components/bottom-sheet';
import { WalletContext } from 'common/contexts/wallet';
import { Booking, SpaceTiming } from 'common/types';
import { Reservation, ReservationStatus } from 'common/types/reservation';
import { format, getTime, parse } from 'date-fns';
import { checkIn } from 'features/passes/check-in/check-in';
import { SpacesMapStackParams } from 'features/spaces-map/spaces-map.navigator';
import { Routes } from 'navigation/routes';
import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import { Alert, StyleSheet, View } from 'react-native';
import { trackCancelled, trackCheckedIn } from 'services/analytics/conversion';
import { analytics, events } from 'services/index';
import { logger } from 'services/logger';
import { reservationService } from 'services/reservation-service';
import theme from 'themes/theme';

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginHorizontal: theme.spacing[8],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginTop: theme.spacing[10],
    marginBottom: theme.spacing[16],
    textAlign: 'center',
  },
  date: {
    color: theme.colors.green[400],
    textAlign: 'center',
  },
  businessTime: {
    color: theme.colors.green[400],
    marginBottom: theme.spacing[6],
    textAlign: 'center',
  },
  address: {
    marginBottom: theme.spacing[12],
    marginTop: theme.spacing[3],
    textAlign: 'center',
  },
  buttonText: {
    color: theme.colors.red[500],
    fontSize: theme.fontSize.lg,
    marginVertical: theme.spacing[8],
  },
  button: {
    backgroundColor: theme.colors.white,
    marginTop: theme.spacing[8],
    marginBottom: theme.spacing[5],
  },
  buttonContainer: {
    marginHorizontal: theme.spacing[8],
  },
});

export interface ReservationConfirmationProps {
  isVisible: boolean;
  spaceName: string;
  address: string;
  reservation: Reservation;
  timings: SpaceTiming[];
  onDismiss: () => void;
  onToggleCheckInPass: (booking: Booking) => void;
}

export const ReservationConfirmation = ({
  isVisible,
  spaceName,
  address,
  reservation,
  timings,
  onDismiss,
  onToggleCheckInPass,
}: ReservationConfirmationProps) => {
  const { formatMessage } = useIntl();
  const navigation = useNavigation<
    NavigationProp<SpacesMapStackParams, 'Map'>
  >();
  const wallet = useContext(WalletContext);
  const businessHours = timings.find(
    (timing) => timing.day === format(reservation.scheduledAt, 'EEEE'),
  )!;
  const handleCancelReservation = async () => {
    try {
      await reservationService.updateReservation(reservation.id, {
        status: ReservationStatus.cancelled,
      });
      trackCancelled({ appLocation: 'Check-in Confirmation Modal' });
      onDismiss();
    } catch (error) {
      showBookingError();
      logger.error('Failed to cancel reservation', error);
    }
  };
  const getReservationDayFormTimings = (
    reservationDay: number,
    timings: SpaceTiming[],
  ) => timings.find((timing) => timing.day === format(reservationDay, 'EEEE'))!;

  const onAddAddFunds = () => {
    onDismiss();
    navigation.navigate(Routes.AddFundsScreen);
  };

  const handleOpenCheckInPass = (newBooking: Booking) => {
    analytics.event(events.viewedEntryPass, {
      'Location Name': spaceName,
      'App Location': 'Check-in Confirmation',
    });
    onToggleCheckInPass(newBooking);
  };

  const showPriceError = () => {
    Alert.alert(
      formatMessage({
        id:
          'spaces-map::check-in-pass::add-guests::dialog::founds-error::title',
      }),
      formatMessage({
        id: 'reservation-modal::work-safe-modal::dialog::founds-error::body',
      }),
      [
        {
          text: formatMessage({ id: 'common-button::actions::cancel' }),
        },
        {
          text: formatMessage({
            id:
              'spaces-map::check-in-pass::add-guests::dialog::founds-error::add-funds',
          }),
          onPress: onAddAddFunds,
        },
      ],
    );
  };
  const showCancellationDialog = () => {
    Alert.alert(
      formatMessage({
        id:
          'reservation-modal::reservation-confirmation::button::cancel-reservation',
      }),
      formatMessage({
        id:
          'reservation-modal::reservation-confirmation::cancellation-dialog::body',
      }),
      [
        {
          text: formatMessage({ id: 'common-button::actions::no' }),
        },
        {
          text: formatMessage({ id: 'common-button::actions::yes' }),
          onPress: handleCancelReservation,
        },
      ],
    );
  };

  const showBookingError = () => {
    Alert.alert(
      formatMessage({
        id: 'reservation-modal::work-safe-modal::booking::error',
      }),
    );
  };

  const confirmReservation = async () => {
    if (!reservation) return;
    const { balance } = wallet || { balance: 0 };
    if (balance < reservation.price) {
      showPriceError();
      return;
    }
    try {
      const reservationDayTiming = getReservationDayFormTimings(
        getTime(reservation.scheduledAt),
        timings,
      );
      const endedAt = getTime(
        parse(reservationDayTiming.close!, 'h:mma', Date.now()),
      );
      await reservationService.updateReservation(reservation.id, {
        status: ReservationStatus.completed,
      });
      const booking = {
        startedAt: Date.now(),
        createdAt: Date.now(),
        endedAt,
        comments: '0',
        price: reservation.price,
        spaceId: reservation.spaceId,
        status: ReservationStatus.active,
        uid: reservation.uid,
        title: reservation.title,
      };
      const newBooking = checkIn(booking);
      trackCheckedIn({ spaceName, appLocation: 'map view' });
      onDismiss();
      handleOpenCheckInPass(newBooking);
    } catch (error) {
      logger.error('Failed to confirm reservation', error);
    }
  };

  return (
    <BottomSheet
      isVisible={isVisible}
      onDismiss={onDismiss}
      style={styles.modal}
    >
      <View style={styles.content}>
        <Text type="h3" style={styles.title}>
          {formatMessage({
            id: 'reservation-modal::reservation-confirmation::title',
          })}
        </Text>
        <Text type="h3" style={styles.date}>
          {format(reservation.scheduledAt, 'EEEE, LLL d')}
        </Text>
        <Text type="h4" style={styles.businessTime}>
          {formatMessage(
            {
              id: 'reservation-modal::reservation-confirmation::business-time',
            },
            { open: businessHours.open, close: businessHours.close },
          )}
        </Text>
        <Text type="h4">{spaceName}</Text>
        <Text style={styles.address}>{address}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <Button.CheckIn
          text={formatMessage({
            id: 'reservation-modal::reservation-confirmation::button::check-in',
          })}
          onPress={confirmReservation}
        />
        <Button.Textual
          text={formatMessage({
            id:
              'reservation-modal::reservation-confirmation::button::cancel-reservation',
          })}
          textStyle={styles.buttonText}
          style={styles.button}
          onPress={showCancellationDialog}
        />
      </View>
    </BottomSheet>
  );
};
