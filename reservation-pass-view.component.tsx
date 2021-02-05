import Color from 'color';
import { Text } from 'common/components';
import { useCurrentUser } from 'common/hooks/use-current-user';
import { Booking, Nullable, Reservation, Space } from 'common/types';
import { format } from 'date-fns';
import { EntryItem } from 'features/passes/check-in/check-in-pass/entry-item';
import { PassActionButtonsContainer } from 'features/passes/check-in/pass-action-buttons-container';
import { PassProfilePhoto } from 'features/passes/check-in/pass-profile-photo';
import { ActionButtons } from 'features/passes/pass-action-button';
import { PassAddress } from 'features/passes/pass-address';
import { PassHeader } from 'features/passes/pass-header';
import { PassLayoutSheet } from 'features/passes/pass-layout-sheet';
import { ReservationModal } from 'features/reservation-modal';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert, StyleSheet, View } from 'react-native';
import { analytics, events } from 'services/analytics';
import theme from 'themes/theme';
import { CheckInInfo } from '../../check-in/check-in-info';
import { CheckInWifi } from '../../check-in/check-in-wifi';
import { usePassActions } from '../../use-pass-actions';

export interface ReservationPassViewProps {
  space: Space;
  reservations: Reservation[];
  activeBooking: Nullable<Booking>;
  reservation: Reservation;
  onCancelReservation: () => any;
}

const styles = StyleSheet.create({
  nameContainer: {
    width: '70%',
  },
  photoContainer: {
    width: '30%',
  },
  titleContainer: {
    flexDirection: 'row',
  },
  uploadAvatar: {
    backgroundColor: Color(theme.colors.yellow[100]).fade(0.5).toString(),
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  dateContainer: {
    marginTop: theme.spacing[20],
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    flexDirection: 'row',
  },
});

export const ReservationPassView = ({
  space,
  reservations,
  activeBooking,
  reservation,
  onCancelReservation,
}: ReservationPassViewProps) => {
  const user = useCurrentUser();
  const { formatMessage } = useIntl();
  const reservationDate = new Date(reservation.scheduledAt);
  const formattedDate = format(reservationDate, 'eeee, MMM d');
  const hoursOpen = space.timings[reservationDate.getDay() - 1];

  const [firstName, lastName] = user.name.split(' ');
  const [isReschedule, setReschedule] = useState(false);

  const onToggleReschedule = () => setReschedule(!isReschedule);

  const onReschedule = () => {
    onToggleReschedule();
    analytics.event(events.beganRescheduling);
  };

  const {
    onToggleWifi,
    onToggleInfo,
    onToggleAddGuest,
    onDismissModal,
    wifiModalVisible,
    infoModalVisible,
    onAddressPress,
  } = usePassActions({ space });

  const onCancelPress = () => {
    Alert.alert(
      formatMessage({
        id: 'passes::reservation-pass::cancel::title',
      }),
      formatMessage({ id: 'passes::reservation-pass::cancel::message' }),
      [
        {
          text: formatMessage({ id: 'common-button::actions::no' }),
          style: 'cancel',
        },
        {
          text: formatMessage({ id: 'common-button::actions::yes' }),
          onPress: onCancelReservation,
        },
      ],
    );
  };

  return (
    <>
      <PassLayoutSheet
        backgroundColor={theme.colors.secondary}
        header={
          <PassHeader
            passType={formatMessage({
              id: 'passes::reservation-pass::header::title',
            })}
          />
        }
        title={
          <>
            <View style={styles.titleContainer}>
              <View style={styles.nameContainer}>
                <Text type="h1">{firstName}</Text>
                <Text type="h1">{lastName}</Text>
              </View>
              <View style={styles.photoContainer}>
                <PassProfilePhoto uploadAvatarStyle={styles.uploadAvatar} />
              </View>
            </View>
            <Text type="h3">{space.name}</Text>
            <PassAddress onPress={onAddressPress}>{space.address}</PassAddress>
            <View style={styles.dateContainer}>
              <Text type="h3">{formattedDate}</Text>
              <ActionButtons.Edit onPress={onReschedule} />
            </View>
            <Text type="h4">
              {hoursOpen.open && hoursOpen.close
                ? formatMessage(
                    {
                      id: 'passes::reservation-pass::hours-open',
                    },
                    { open: hoursOpen.open, close: hoursOpen.close },
                  )
                : // not sure if this will ever happen but could lead to a bad UX if it does.
                  formatMessage({
                    id: 'passes::reservation-pass::might-be-closed',
                  })}
            </Text>
          </>
        }
        bottomAction={
          <PassActionButtonsContainer>
            <ActionButtons.Info onPress={onToggleInfo} />
            <ActionButtons.Wifi onPress={onToggleWifi} disabled />
            <ActionButtons.AddGuest onPress={onToggleAddGuest} disabled />
            <ActionButtons.Delete onPress={onCancelPress} />
            <CheckInInfo
              isVisible={infoModalVisible}
              onDismiss={onDismissModal}
              details={space.details}
            />
            <CheckInWifi
              isVisible={wifiModalVisible}
              onDismiss={onDismissModal}
              wifiName={space.wifiName}
              wifiPassword={space.wifiPassword}
            />
          </PassActionButtonsContainer>
        }
        content={
          <>
            {space.entryPassSections.map((section) => (
              <EntryItem key={section.title} {...section} />
            ))}
          </>
        }
      />
      {isReschedule && (
        <ReservationModal
          isVisible={isReschedule}
          isReschedule={true}
          space={space}
          appLocation="reservation pass"
          reservation={reservation}
          onDismiss={onToggleReschedule}
          reservations={reservations}
          booking={activeBooking}
        />
      )}
    </>
  );
};
