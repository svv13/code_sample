import React, {Component, RefObject} from 'react';
import CustomInputNumber from "../../../Shared/InputTypeNumber";
import DateFormatting from "../../../Utils/DateFormatting";
import TimeButtonsComponent from "./TimeButtonsComponent";
import YellowButton from "../../../Shared/Buttons/YellowButton";
import Calendar from "./Calendar";
import BookingStore from "../../../Stores/BookingStore";
import {observer} from "mobx-react";
import StepsComponent from "../../../Shared/StepsComponent";
import {RouterProps} from "react-router";
import AuthStore from "../../../Stores/AuthStore";
import Popup from "../../Popups/Popup";
import {PopupContent} from "../../../Constants/PopupContent";
import TooltipComponent from "../../../Shared/Tooltip";
import TimeStore from "../../../Stores/TimeStore";
import ValetsStore from "../../../Stores/ValetsStore";
import queryString from 'query-string';
interface IProps extends RouterProps {
    groupBook: boolean
}

interface IState {
    showModal: boolean;
    showTooltip: boolean;
}

@observer
export default class BookingDetails extends Component<IProps, IState> {
    state = {
        showModal: false,
        showTooltip: false,
    };
    target: RefObject<any> = React.createRef();

    continueBooking = async (hoursLeft: number) => {
        try{
        if (hoursLeft) {
            this.setState({showTooltip: true});
            setTimeout(()=> this.setState({showTooltip:false}), 2000);
            return;
        }
        const parsed:any = queryString.parse(window.location.search);

        if(parsed.rescheduleItem){
            await BookingStore.editPrice(true);
        } else {
            const isBookingCreated = await BookingStore.createBookingStep1();
            if (isBookingCreated === null) return;
        }
          BookingStore.setBookingToStorage();
          if(AuthStore.isLogged){
            if(parsed.rescheduleItem){
                this.props.history.push(`/payment_choose?rescheduleItem=${parsed.rescheduleItem}`);
            } else{
                this.props.history.push("/payment_choose");
            }
          } else {
            this.props.history.push("/payment_details");

          }
        }catch(e){
            console.log(e)
        }
    };
    checkOnTheWayNotification = (event: React.ChangeEvent<HTMLInputElement>) =>
        BookingStore.changeBookingData(event.target.id, event.target.checked);
    addNotes = (event: React.ChangeEvent<HTMLTextAreaElement>) =>
        BookingStore.changeBookingData(event.target.id, event.target.value);
    showModal = (state: boolean) => this.setState({showModal: state});

    changeShowTimeOption = (event:React.ChangeEvent<HTMLInputElement>) => TimeStore.showAllValet = event.target.checked;
    componentDidMount() {
        if(!AuthStore.jwt.token){
            this.props.history.push("/")
        }
    }
    
    render() {
        const {tell_me_on_way, notes, date, quantity} = BookingStore.bookingData;
        const {showAllValet} = TimeStore;
        const numberOfNeededHours = Math.round(quantity / 2) - TimeStore.reservedHoursQuantity;
        const parsed:any = queryString.parse(window.location.search);
        return (
          <div className="gray_background unreg_booking">
            <StepsComponent
              steps={AuthStore.isLogged ? "bookingSteps" : "bookingStepsNotReg"}
              done={AuthStore.isLogged ? [0] : [0, 1]}
              active={AuthStore.isLogged ? 1 : 2}
              onBack={this.props.history.goBack}
            />
            <div className="container d-flex flex-column align-items-center inner_container">
              <h1>Booking details</h1>
              <CustomInputNumber
                disabled={!!parsed.rescheduleItem}
                value={quantity}
              />
              <h5>Date and Time</h5>
              <h6>{DateFormatting.bookingTitleDate(date)}</h6>
              <Calendar />

              <TimeButtonsComponent
                showModal={() => this.showModal(true)}
                period={"morning"}
              />
              <TimeButtonsComponent
                showModal={() => this.showModal(true)}
                period={"afternoon"}
              />
              <TimeButtonsComponent
                showModal={() => this.showModal(true)}
                period={"evening"}
              />
              {ValetsStore.isUserHasOnlyValet && !parsed.rescheduleItem && (
                <div className={"d-flex mt-3 mb-0 show_only_valet"}>
                  <div className="form-group pl-4">
                    <input
                      type="checkbox"
                      className="form-check-input styled-checkbox"
                      id="show_only_valet"
                      checked={showAllValet}
                      onChange={this.changeShowTimeOption}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="show_only_valet"
                    >
                      Show times for valets on schedule.
                    </label>
                  </div>
                </div>
              )}
              <form className={"notes"}>
                <div className="form-group">
                  <label htmlFor="notes">Notes for Valet</label>
                  <textarea
                    className="form-control"
                    id="notes"
                    rows={4}
                    placeholder={"Notes..."}
                    onChange={this.addNotes}
                    value={notes}
                  />
                  {BookingStore.errorsOnForm.notesError && (
                    <span className={"inline_error"}>
                      {BookingStore.errorsOnForm.notesError}
                    </span>
                  )}
                </div>
                <div className="form-group pl-4">
                  <input
                    type="checkbox"
                    className="form-check-input styled-checkbox"
                    id="tell_me_on_way"
                    checked={tell_me_on_way}
                    onChange={this.checkOnTheWayNotification}
                  />
                  <label className="form-check-label" htmlFor="tell_me_on_way">
                    Tell me when you're on the way.
                  </label>
                </div>
              </form>
              {BookingStore.errorsOnForm.firstStep && (
                <span className={"inline_error"}>
                  {BookingStore.errorsOnForm.firstStep}
                </span>
              )}
              <YellowButton
                onClick={() => this.continueBooking(numberOfNeededHours)}
                value={"continue"}
                refLink={this.target}
              />
              <TooltipComponent
                target={this.target.current}
                show={this.state.showTooltip}
                content={`To serve ${quantity} person(s) you need to book ${numberOfNeededHours} more hour(s).`}
              />
              <Popup
                title={"Late night hours"}
                content={PopupContent.lateNight}
                id={"lateNightModal"}
                onHide={() => {
                  TimeStore.showLateNightModal = false;
                }}
                show={TimeStore.showLateNightModal}
              />
              <Popup
                title={"We are sorry!"}
                content={PopupContent.bookingDisabled}
                id={"booking_Disabled"}
                onHide={() => {
                  BookingStore.bookingDisabled = false;
                }}
                show={BookingStore.bookingDisabled}
              />
            </div>
          </div>
        );
    }
};


