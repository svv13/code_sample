import React, { Component } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	AppState
} from "react-native";
import { defaultText } from "../../../constants/styles/text";
import DatePicker from "../../../shared/DatePiker";
import PikerBtn from "../../../shared/PikerBtn";
import { defaultPiker } from "../../../constants/styles/piker";
import ReactNativePickerModule from "react-native-picker-module";
import { observer } from "../../../../node_modules/mobx-react";
import { bookSprayTanStore } from "../stores/index.js";
import CustomBtn from "../../../shared/CustomBtn";
import CardTime from "./CardTime";
import TextArea from "../../../shared/TextArea";
import { defaultBtn } from "../../../constants/styles/button";
import { mainColor, defaultBackground } from "../../../constants/styles/color";
import CheckBox from "../../../shared/CheckBox";
import ModalHome from "../modals/index.js";
import Icon from "../../../shared/Icon";
import ValetInfoCard from "./ValetInfoCard";
import { Container, Content } from "native-base";
import { errorMessageStyle } from "../../../constants/styles/input";
import Helper from "../../../service/helpers";
import BookSprayTanStore from "../../HomePage/stores/BookSprayTanStore";

const DatePickerBtn = observer(({ onOpen }) => {
	const currentDate = new Date(BookSprayTanStore.bookFields.date);
	return (
		<TouchableOpacity onPress={onOpen} style={style.pikerContainer}>
			<PikerBtn data={{ date: currentDate }} placeholder="Date" type="date">
				<Icon name="date" source="home" />
			</PikerBtn>
		</TouchableOpacity>
	);
});
@observer
class BookSprayTan extends Component {
	state = {
		pickerVisible: false
	};

	onOpenPicker = () => {
		this.setState({ pickerVisible: true });
	};

	onCloseModal = () => {
		this.setState({ pickerVisible: false });
	};

	onDateChange = (event, date) => {
		console.log("onDateChange", date);
		bookSprayTanStore.setDate({ date });
		this.setState({ pickerVisible: false });
	};

	async componentDidMount() {
		if (!bookSprayTanStore.componentState.isEdit) {
			await bookSprayTanStore.checkOnlyValet();
		}
		bookSprayTanStore.getAvailableTimes();
		AppState.addEventListener("change", this._handleAppStateChange);
	}

	componentWillUnmount() {
		AppState.removeEventListener("change", this._handleAppStateChange);
	}

	createPeriodOptions = period => {
		const { availableTimeOptions } = bookSprayTanStore;
		return availableTimeOptions.filter(option => option.period === period);
	};

	_handleAppStateChange = nextAppState => {
		if (nextAppState === "active") {
			bookSprayTanStore.setDate({
				date: Helper.getLATime().format("YYYY-MM-DD")
			});
		}
	};

	render() {
		const {
			optionPersons,
			setSelectedCountPerson,
			componentState,
			bookFields,
			onChange,
			toggleCheckbox,
			valet,
			toggleNotesForValet,
			submitFirstStep,
			errorsOnForms,
			switchOnlyValet
		} = bookSprayTanStore;
		const { pickerVisible } = this.state;

		const morningOptions = this.createPeriodOptions("morning");
		const afternoonOptions = this.createPeriodOptions("afternoon");
		const eveningOptions = this.createPeriodOptions("evening");
		const extraHours =
			Math.round(bookFields.number_of_people * 0.5) - bookFields.time.length;

		return (
			<Container>
				<Content
					contentContainerStyle={{ flexGrow: 1 }}
					style={style.container}
				>
					<View style={style.detailsContainer}>
						<Text style={style.detailsTitle}>appointment details</Text>
						{valet ? (
							<ValetInfoCard
								{...valet}
								isRebook={componentState.isRebook}
								isEdit={componentState.isEdit}
								showAnyValets={componentState.showAnyValets}
								onChangeSwitch={switchOnlyValet}
								isOnly={valet.isOnly}
							/>
						) : null}

						<View style={style.detailsSelectContainer}>
							<DatePickerBtn onOpen={this.onOpenPicker} />
							<DatePicker
								onChange={this.onDateChange}
								visible={pickerVisible}
								onClose={this.onCloseModal}
							/>
							<TouchableOpacity
								style={style.pikerContainer}
								onPress={() => this.pickerRef.show()}
								disabled={bookSprayTanStore.componentState.isEdit}
							>
								<PikerBtn
									placeholder="Persons"
									data={bookFields.number_of_people}
									type="persons"
									disabled={bookSprayTanStore.componentState.isEdit}
								>
									<Icon name="profile" source="moreInfo" />
								</PikerBtn>
							</TouchableOpacity>
							<ReactNativePickerModule
								pickerRef={e => (this.pickerRef = e)}
								value={optionPersons.indexOf(bookFields.number_of_people)}
								title={"Select a persons"}
								items={Array.from(optionPersons)}
								onValueChange={index =>
									setSelectedCountPerson(parseFloat(index))
								}
							/>
						</View>
					</View>
					<View style={style.infoContainer}>
						{componentState.isWarn ? (
							<View style={style.warnContainer}>
								<Icon name="warn" source="home" />
								<Text style={style.textWarn}>
									To serve {bookFields.number_of_people} people you need to book
									{` ${extraHours}`} more hour.
								</Text>
							</View>
						) : null}
					</View>
					<View style={style.availableTimeContainer}>
						<View style={style.availableTimeTextContainer}>
							<Text style={style.availableTimeText}>Available time</Text>
							<Icon name="help" source="moreInfo" />
						</View>
						<View style={style.timePeriodContainer}>
							<Text style={style.textWarn}>Morning</Text>
							<ScrollView
								horizontal={true}
								contentContainerStyle={{ height: 50 }}
							>
								<View style={style.containerCards}>
									{morningOptions.map(timeOptions => (
										<CardTime
											{...timeOptions}
											key={timeOptions.value}
											period={timeOptions.period}
										/>
									))}
								</View>
							</ScrollView>
						</View>
						<View style={style.timePeriodContainer}>
							<Text style={style.textWarn}>Afternoon</Text>
							<ScrollView
								horizontal={true}
								contentContainerStyle={{ height: 50 }}
							>
								<View style={style.containerCards}>
									{afternoonOptions.map(timeOptions => (
										<CardTime
											{...timeOptions}
											key={timeOptions.value}
											period={timeOptions.period}
										/>
									))}
								</View>
							</ScrollView>
						</View>
						<View style={style.timePeriodContainer}>
							<Text style={style.textWarn}>Evening</Text>
							<ScrollView
								horizontal={true}
								contentContainerStyle={{ height: 50 }}
							>
								<View style={style.containerCards}>
									{eveningOptions.map(timeOptions => (
										<CardTime
											{...timeOptions}
											key={timeOptions.value}
											period={timeOptions.period}
										/>
									))}
								</View>
							</ScrollView>
						</View>
						<View style={style.notesForValet}>
							<TouchableOpacity
								style={style.notesBtnContainer}
								onPress={toggleNotesForValet}
							>
								<Text style={style.textWarn}>
									Press <Text style={style.btnText}>here</Text> to leave Notes
									for Valet
								</Text>
							</TouchableOpacity>
							{componentState.isShowNotes ? (
								<TextArea
									value={bookFields.notes}
									placeholder="Notes..."
									onChangeText={value => onChange(value, "notes")}
									errorOnField={errorsOnForms.notes}
								/>
							) : null}
							<CheckBox
								placeholder="Tell me when you’re on the way."
								isChecked={bookFields.way_notification}
								onPress={() => toggleCheckbox("way_notification")}
							/>
						</View>
					</View>
					<ModalHome
						modalName={componentState.modalName}
						visible={componentState.modalVisible}
					/>
					<View style={style.btnControl}>
						{errorsOnForms.firstStep ? (
							<Text style={errorMessageStyle}>{errorsOnForms.firstStep}</Text>
						) : null}
						<CustomBtn
							title="Continue"
							onPress={submitFirstStep}
							buttonContainerStyle={style.button}
							buttonTextStyle={style.buttonTextStyle}
							loading={componentState.loadingFirstSep}
						/>
					</View>
				</Content>
			</Container>
		);
	}
}

const style = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: defaultBackground
	},
	detailsContainer: {
		flex: 3,
		justifyContent: "flex-end",
		marginTop: 25
	},
	infoContainer: {
		flex: 1.5
	},
	availableTimeContainer: {
		flex: 3.5
	},
	detailsSelectContainer: {
		height: 102,
		backgroundColor: "white"
	},
	detailsTitle: {
		...defaultText,
		textTransform: "uppercase",
		paddingLeft: 15,
		marginBottom: 17
	},
	pikerContainer: {
		...defaultPiker.container
	},
	warnContainer: {
		flex: 1,
		borderColor: "#E0E0E0",
		borderWidth: 1,
		borderStyle: "solid",
		borderRadius: 6,
		height: 56,
		marginLeft: 16,
		marginRight: 16,
		marginTop: 19,
		alignItems: "center",
		flexDirection: "row",
		padding: 10
	},
	textWarn: {
		fontSize: 12
	},
	availableTimeTextContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 25
	},
	availableTimeText: {
		...defaultText,
		marginLeft: 15,
		marginRight: 5,
		color: "#484848"
	},
	timePeriodContainer: {
		flex: 2,
		marginLeft: 15,
		marginTop: 13
	},
	containerCards: {
		flexDirection: "row",
		marginTop: 5,
		height: "100%",
		flexWrap: "nowrap"
	},
	notesForValet: {
		marginTop: 17,
		marginLeft: 15,
		marginRight: 15
	},
	button: {
		backgroundColor: mainColor,
		alignItems: "center",
		justifyContent: "center",
		...defaultBtn.button,
		width: "100%"
	},
	buttonTextStyle: {
		color: "white",
		...defaultBtn.buttonTextStyle
	},
	btnControl: {
		flex: 0.5,
		justifyContent: "flex-end",
		alignItems: "center",
		marginTop: 20,
		paddingBottom: 11,
		marginLeft: 16,
		marginRight: 16
	},
	notesBtnContainer: {
		flexDirection: "row",
		alignItems: "center"
	},
	promoForm: {
		backgroundColor: "white",
		height: 200,
		marginLeft: 10,
		marginRight: 10,
		padding: 10,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 4
	},
	promoText: {
		color: mainColor,
		fontSize: 14,
		lineHeight: 17,
		textAlign: "center",
		marginTop: 10
	},
	btnText: {
		color: mainColor,
		textTransform: "uppercase"
	}
});

export default BookSprayTan;
