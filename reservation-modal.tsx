import { useNavigation } from '@react-navigation/core';
import { Button, Text } from 'common/components';
import { BottomSheet } from 'common/components/bottom-sheet';
import { DatePickerModal } from 'common/components/date-picker-modal/date-picker-modal';
import { WalletContext } from 'common/contexts/wallet';
import { useCurrentUser } from 'common/hooks/use-current-user';
import { useIsFirstTimeUser } from 'common/hooks/use-is-first-time-user';
import { useNotificationPermission } from 'common/hooks/use-notofication-permission';
import {
  Booking,
  Nullable,
  Reservation,
  Space,
  SpaceTiming,
} from 'common/types';
import { ReservationStatus } from 'common/types/reservation';
import {
  addDays,
  format,
  getDay,
  getTime,
  isSameDay,
  isToday,
  parse,
} from 'date-fns';
import { cancelBooking, checkIn } from 'features/passes/check-in/check-in';
import { SettingsRoutes } from 'features/settings/settings.navigator';
import { SpacesMapStackParams } from 'features/spaces-map/spaces-map.navigator';
import { convertSpaceTimeToDate } from 'features/spaces-map/spaces-map.utils';
import { View } from 'native-base';
import { AppRoutes } from 'navigation/app.navigator';
import { NavigationProp } from 'navigation/types';
import React, { useContext, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert, StyleSheet } from 'react-native';
import { RESULTS } from 'react-native-permissions';
import { analytics, events } from 'services/analytics';
import {
  trackCancelled,
  trackCheckedIn,
  trackReserved,
} from 'services/analytics/conversion';
import { logger } from 'services/logger';
import {
  ReservationData,
  reservationService,
} from 'services/reservation-service';
import { setToken } from 'services/tokens-services/token-services';
import theme from 'themes/theme';
import { getMinimumDate } from './reservation-modal.utils';
import { WorkSafeModal } from './work-safe-modal';

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContainer: {
    borderColor: theme.colors.gray[300],
    borderTopWidth: theme.spacing[1],
    borderBottomWidth: theme.spacing[1],
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: theme.spacing[10],
    paddingBottom: theme.spacing[12],
  },
  dateText: {
    color: theme.colors.green[400],
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.medium,
    marginTop: theme.spacing[3],
    textAlign: 'center',
  },
  titleContainer: {
    paddingTop: theme.spacing[10],
    paddingBottom: theme.spacing[16],
  },
  centerText: {
    textAlign: 'center',
  },
  description: {
    color: theme.colors.gray[600],
    marginTop: theme.spacing[10],
  },
  checkInButton: {
    width: '100%',
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing[8],
    paddingTop: theme.spacing[6],
    marginBottom: theme.spacing[5],
  },
});

export interface ReservationModalProps {
  space: Space;
  isVisible: boolean;
  isReschedule?: boolean;
  reservation?: Reservation;
  appLocation: 'map view' | 'location page' | 'reservation pass';
  reservations: Reservation[];
  booking: Nullable<Booking>;
  onDismiss: () => void;
}

export const ReservationModal = ({
  space,
  isVisible,
  isReschedule,
  reservation,
  reservations,
  booking,
  appLocation,
  onDismiss,
}: ReservationModalProps) => {
  const navigation = useNavigation<
    NavigationProp<SpacesMapStackParams, 'Map'>
  >();
  const [isWorkSafe, setWorkSafe] = useState(false);
  const { isFirstTimeUser } = useIsFirstTimeUser();
  const { requestPermission, permission } = useNotificationPermission();
  const [isScheduleConfirmation, setScheduleConfirmation] = useState(false);
  const toggleWorkSafeModal = () => setWorkSafe(!isWorkSafe);
  const toggleScheduleConfirmationModal = () =>
    setScheduleConfirmation(!isScheduleConfirmation);
  const toggleCheckInPass = (booking: Booking) => {
    onDismiss();
    analytics.event(events.viewedEntryPass, {
      'Location Name': space.name,
      'App Location': 'Reservation Page',
    });
    navigation.navigate(AppRoutes.CheckInPass, { booking });
  };
  const viewMyReservations = () => {
    onDismiss();
    navigation.navigate(AppRoutes.SettingsNavigator, {
      screen: SettingsRoutes.ReservationsScreen,
    });
  };
  const currentUser = useCurrentUser();
  const wallet = useContext(WalletContext);

  const { formatMessage } = useIntl();
  const [isDatePicker, setDatePicker] = useState(false);

  const getReservationDayFormTimings = (reservationDay: number) =>
    space.timings.find(
      (timing) => timing.day === format(reservationDay, 'EEEE'),
    )!;

  const validateDate = (date: Date) => {
    if (!unavailableDays) return true;
    return unavailableDays.some((day) => day === format(date, 'EEEE'));
  };

  const getNextBusinessDay = (date: Date): Date => {
    const nextDay = addDays(date, 1);
    const isInvalidDate = validateDate(nextDay);

    const validDate = isInvalidDate ? getNextBusinessDay(nextDay) : nextDay;
    return validDate;
  };

  const unavailableDays = space.timings
    .filter((timing) => !timing.open && !timing.close)
    .map((timing) => timing.day);

  const currentDayTiming = getReservationDayFormTimings(
    getTime(getNextBusinessDay(new Date())),
  );

  const minimumDate = getMinimumDate({
    currentDayTimings: currentDayTiming,
    nextBusinessDay: getNextBusinessDay(new Date()),
    isReschedule,
  });

  const maximumDate = addDays(minimumDate, 30);

  const [date, setDate] = useState(minimumDate);

  useEffect(() => {
    if (reservation && isReschedule) {
      setDate(new Date(reservation.scheduledAt));
    }
  }, [reservation, isReschedule]);

  const resetState = () => {
    setWorkSafe(false);
    setScheduleConfirmation(false);
    setDatePicker(false);
    setDate(minimumDate);
  };

  const dismissModal = () => {
    resetState();
    onDismiss();
  };

  const onAddFunds = () => {
    onDismiss();
    navigation.navigate(AppRoutes.SettingsNavigator, {
      screen: SettingsRoutes.AddFundsScreen,
    });
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
          onPress: onAddFunds,
        },
      ],
    );
  };
  const insufficientFundsCheck = (): boolean => {
    const { balance } = wallet || { balance: 0 };
    if (!space.price) return false;
    const insufficientFundsCondition = isToday(date) && balance < space.price;
    if (insufficientFundsCondition) {
      showPriceError();
    }
    return insufficientFundsCondition;
  };

  const getExistingReservation = (date: Date): Reservation | undefined => {
    if (reservations.length === 0) return undefined;
    return reservations.find((r) => isSameDay(r.scheduledAt, getTime(date)));
  };

  const bookingExists = (date: Date): boolean => {
    return isToday(getTime(date)) && booking !== undefined;
  };

  const cancelReservation = async (reservation: Reservation) => {
    try {
      trackCancelled({ appLocation: 'Reservation Modal' });
      await reservationService.updateReservation(reservation.id, {
        status: ReservationStatus.cancelled,
      });
      !insufficientFundsCheck() && toggleWorkSafeModal();
    } catch (error) {
      logger.error('Failed to cancel reservation', error);
    }
  };

  const cancelActiveBooking = async () => {
    if (!booking) return;
    cancelBooking(currentUser.uid, booking.id)
      .then(() => {
        !insufficientFundsCheck() && toggleWorkSafeModal();
      })
      .catch((err) => {
        logger.error('Failed to cancel booking', err);
      });
  };

  const showConflictedReservationWarning = (reservation: Reservation) => {
    Alert.alert(
      formatMessage({
        id:
          'reservation-modal::schedule-modal::conflicted-reservation-dialog::title',
      }),
      formatMessage({
        id:
          'reservation-modal::schedule-modal::conflicted-reservation-dialog::body',
      }),
      [
        {
          text: formatMessage({ id: 'common-button::actions::no' }),
        },
        {
          text: formatMessage({ id: 'common-button::actions::yes' }),
          onPress: () => cancelReservation(reservation),
        },
      ],
    );
  };

  const showConflictedBookingWarning = () => {
    Alert.alert(
      formatMessage({
        id:
          'reservation-modal::schedule-modal::conflicted-booking-dialog::title',
      }),
      formatMessage({
        id:
          'reservation-modal::schedule-modal::conflicted-booking-dialog::body',
      }),
      [
        {
          text: formatMessage({ id: 'common-button::actions::no' }),
        },
        {
          text: formatMessage({ id: 'common-button::actions::yes' }),
          onPress: cancelActiveBooking,
        },
      ],
    );
  };
  const createReservation = async (reservationData: ReservationData) => {
    trackReserved({ appLocation, locationName: reservationData.title });
    await reservationService.createReservation(reservationData);
  };

  const rescheduleReservation = async () => {
    if (!currentUser || !reservation) return;
    try {
      analytics.event(events.rescheduled);
      await reservationService.updateReservation(reservation.id, {
        scheduledAt: getScheduledAtDate(space.timings, date),
        status: ReservationStatus.active,
      });
    } catch (error) {
      logger.error('Failed to reschedule reservation', error);
    }
  };

  const submitScheduleModal = () => {
    const conflictedReservation = getExistingReservation(date);
    const conflictedBooking = bookingExists(date);
    if (isReschedule && reservation) {
      rescheduleReservation();
      navigation.navigate(AppRoutes.ReservationPass, {
        reservation: { ...reservation, scheduledAt: getTime(date) },
        reservations,
        activeBooking: booking,
      });
      onDismiss();

      return;
    }

    if (conflictedReservation) {
      showConflictedReservationWarning(conflictedReservation);
      return;
    }

    if (conflictedBooking) {
      showConflictedBookingWarning();
      return;
    }

    !insufficientFundsCheck() && toggleWorkSafeModal();
  };

  const createBooking = async (uid: string, price: number) => {
    const isInsufficientFunds = insufficientFundsCheck();
    if (isInsufficientFunds) return;
    const reservationDayTiming = getReservationDayFormTimings(getTime(date));
    const dateNow = new Date();
    const endedAt = getTime(
      parse(reservationDayTiming.close!, 'h:mma', Date.now()),
    );
    const startedAt = getTime(
      parse(reservationDayTiming.open!, 'h:mma', Date.now()),
    );
    const bookingData = {
      createdAt: getTime(dateNow),
      startedAt,
      endedAt,
      comments: '0',
      price,
      spaceId: space.id,
      title: space.name,
      uid,
      status: 'active',
    };
    const booking = await checkIn(bookingData);
    trackCheckedIn({ spaceName: space.name, appLocation: 'location page' });
    toggleCheckInPass(booking);
    resetState();
  };

  const getScheduledAtDate = (
    spaceTiming: SpaceTiming[],
    reservationDate: Date,
  ): number => {
    const reservationDay =
      getDay(reservationDate) - 1 < 0 ? 6 : getDay(reservationDate) - 1;
    const spaceOpenTiming = spaceTiming[reservationDay];
    if (spaceOpenTiming.open) {
      return getTime(convertSpaceTimeToDate(spaceOpenTiming.open, date));
    }
    return getTime(reservationDate);
  };

  const reservationProcess = async () => {
    const { name, price, id, timings } = space;
    const spacePrice = price || 0;
    if (!currentUser) return;

    const status = isToday(date)
      ? ReservationStatus.completed
      : ReservationStatus.active;
    try {
      const reservationData = {
        createdAt: getTime(new Date()),
        scheduledAt: getScheduledAtDate(timings, date),
        title: name,
        uid: currentUser.uid,
        status,
        price: spacePrice,
        spaceId: id,
      };

      await createReservation(reservationData);
      if (isFirstTimeUser || permission !== RESULTS.GRANTED) {
        await requestPermission();
        setToken(currentUser.uid);
      }

      if (status === ReservationStatus.completed) {
        createBooking(reservationData.uid, spacePrice);
        return;
      }

      toggleScheduleConfirmationModal();
    } catch (error) {
      logger.error('Failed to create reservation', error);
    }
  };

  const onSelectDate = (date: Date) => {
    setDate(date);
    setDatePicker(false);
  };

  const toggleDatePicker = () => {
    setDatePicker(!isDatePicker);
  };

  const textualDate = isToday(date)
    ? `Today, ${format(date, 'EEEE LLL d')}`
    : format(date, 'EEEE, LLL d');

  const buttonText = isReschedule
    ? formatMessage({
        id: 'spaces-map::spaces-preview::reschedule',
      })
    : formatMessage({
        id: 'spaces-map::spaces-preview::checkin',
      });

  return (
    <BottomSheet
      isVisible={isVisible}
      onDismiss={dismissModal}
      style={styles.modal}
      testID="reservation-modal"
    >
      <View style={styles.titleContainer}>
        <Text type="h3" style={styles.centerText}>
          {formatMessage({
            id: 'reservation-modal::schedule-modal::title',
          })}
        </Text>
        <Text type="textStrong" style={styles.centerText}>
          {formatMessage({
            id: 'reservation-modal::schedule-modal::subtitle',
          })}
        </Text>
      </View>
      <View style={styles.dateContainer}>
        <Text
          style={styles.centerText}
        >{`${currentDayTiming.open} - ${currentDayTiming.close}`}</Text>
        <Button.Textual
          text={textualDate}
          textStyle={styles.dateText}
          onPress={toggleDatePicker}
        />
      </View>
      <Text style={[styles.description, styles.centerText]}>
        {formatMessage({
          id: 'reservation-modal::schedule-modal::description',
        })}
      </Text>
      <View style={styles.buttonContainer}>
        <Button.CheckIn
          text={buttonText}
          onPress={submitScheduleModal}
          style={styles.checkInButton}
        />
      </View>
      <DatePickerModal
        isVisible={isDatePicker}
        onDismiss={toggleDatePicker}
        onDone={onSelectDate}
        unavailableDays={unavailableDays}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        initialDate={date}
        reservations={reservations}
      />
      <WorkSafeModal
        space={space}
        isVisible={isWorkSafe}
        isScheduleConfirmation={isScheduleConfirmation}
        address={space.address}
        spaceName={space.name}
        date={date}
        businessHours={getReservationDayFormTimings(getTime(date))}
        onCheckInPassDismiss={dismissModal}
        onDismiss={toggleWorkSafeModal}
        onSubmit={reservationProcess}
        viewMyReservation={viewMyReservations}
        onDismissScheduleSuccess={dismissModal}
      />
    </BottomSheet>
  );
};
