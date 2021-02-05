import React, { Component } from "react";
import {
	View,
	StyleSheet,
	Text,
	Image,
	TouchableOpacity,
	Linking
} from "react-native";
import { observer } from "../../../../node_modules/mobx-react";
import { bookSprayTanStore } from "../stores";
import { defaultText } from "../../../constants/styles/text";
import { defaultBackground, mainColor } from "../../../constants/styles/color";
import PikerBtn from "../../../shared/PikerBtn";
import { defaultPiker } from "../../../constants/styles/piker";
import CustomBtn from "../../../shared/CustomBtn";
import { defaultBtn } from "../../../constants/styles/button";
import CheckBox from "../../../shared/CheckBox";
import Icon from "../../../shared/Icon";
import moment from "moment";
import { Actions } from "react-native-router-flux";
import paymentsStore from "../../Payments/stores";
import PromoCode from "./PromoCode";
import Prices from "./Prices";
import Subscriptions from "./Subscriptions";
import purchase_methods from "../../../constants/purchase_methods";
import { Container, Content } from "native-base";
import { errorMessageStyle } from "../../../constants/styles/input";

@observer
class SprayValet extends Component {
	componentDidMount() {
		if (!bookSprayTanStore.componentState.isEdit) {
			bookSprayTanStore.getPrice(bookSprayTanStore.bookFields.address);
		}
	}

	componentWillUnmount() {
		bookSprayTanStore.checkOnlyValet();
	}

	render() {
		const {
			bookFields,
			componentState,
			toggleCheckbox,
			booking,
			valet,
			errorsOnForms,
			prices,
			bookBtnDisabled
		} = bookSprayTanStore;

		const bookedDate = moment(bookFields.date).format("ddd, MMM DD, YYYY");
		const valetName = valet ? valet.first_name : "Valet to be defined";
		const isSubscriptionsShowed =
			!componentState.isClientHasSubscription &&
			bookFields.purchase_method === purchase_methods.SUBSCRIPTION &&
			prices[purchase_methods.SUBSCRIPTION].price;

		return (
			<Container style={style.container}>
				<Content contentContainerStyle={{ flexGrow: 1 }} style={style.content}>
					<Text style={style.timeTitle}>{bookedDate}</Text>
					<View style={style.bookInfo}>
						<View style={style.bookInfoItem}>
							<Image source={require("../../../assets/icons/timeIcon.png")} />
							<Text style={style.bookInfoText}>{bookFields.time[0].label}</Text>
						</View>
						<View style={style.arrow} />
						<View style={style.bookInfoItem}>
							<Image source={require("../../../assets/icons/personIcon.png")} />
							<Text style={style.bookInfoText}>{valetName}</Text>
						</View>
					</View>
					<View style={style.detailsSelectContainer}>
						<TouchableOpacity
							style={style.pikerContainer}
							onPress={() => {
								Actions.paymentsManagement();
								paymentsStore.setRedirectComponent("sprayValet");
							}}
							disabled={bookSprayTanStore.componentState.isEdit}
						>
							<PikerBtn
								placeholder={componentState.card_numberPlaceholder}
								type="persons"
								disabled={bookSprayTanStore.componentState.isEdit}
							>
								<Icon name="payment" source="moreInfo" />
							</PikerBtn>
						</TouchableOpacity>
					</View>
					{!componentState.isEdit ? <PromoCode /> : null}
					{!componentState.isPriceHide ? <Prices /> : null}
					{isSubscriptionsShowed ? <Subscriptions /> : null}
					<View style={style.toSContainer}>
						<CheckBox
							isChecked={bookFields.isAgreeWithTerms}
							onPress={() => toggleCheckbox("isAgreeWithTerms")}
							errorOnField={errorsOnForms.toS}
						/>
						<Text style={{ marginTop: 18, fontSize: 12 }}>
							By checking this box, you agree to our
						</Text>
						<Text
							style={style.link}
							onPress={() =>
								Linking.openURL("https://sprayvalet.com/terms-of-service/")
							}
						>
							terms of service.
						</Text>
					</View>
				</Content>
				<View style={style.btnControl}>
					{errorsOnForms.secondStep ? (
						<Text style={errorMessageStyle}>{errorsOnForms.secondStep}</Text>
					) : null}
					<CustomBtn
						title="book"
						buttonContainerStyle={style.button}
						buttonTextStyle={style.buttonTextStyle}
						onPress={booking}
						loading={componentState.loadingSecondStep}
						disabled={bookBtnDisabled}
						showDisabled
					/>
				</View>
			</Container>
		);
	}
}

const style = StyleSheet.create({
	content: {
		flex: 1,
		height: "100%"
	},
	container: {
		backgroundColor: defaultBackground
	},
	timeTitle: {
		...defaultText,
		textTransform: "uppercase",
		paddingLeft: 15,
		marginBottom: 17,
		marginTop: 25
	},
	bookInfo: {
		backgroundColor: "white",
		marginLeft: 15,
		marginRight: 15,
		justifyContent: "center",
		alignItems: "center",
		flexDirection: "row",
		paddingLeft: 30,
		paddingRight: 30,
		height: 70,
		borderRadius: 4
	},
	arrow: {
		width: 1,
		height: 30,
		backgroundColor: "#E4E4E4",
		marginLeft: 20,
		marginRight: 20
	},
	bookInfoItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center"
	},
	bookInfoText: {
		marginLeft: 3,
		fontSize: 14,
		lineHeight: 17
	},
	pikerContainer: {
		...defaultPiker.container
	},
	detailsSelectContainer: {
		backgroundColor: "white",
		marginTop: 21
	},
	button: {
		backgroundColor: mainColor,
		marginBottom: 11,
		marginTop: 10,
		...defaultBtn.button
	},
	buttonTextStyle: {
		color: "white",
		...defaultBtn.buttonTextStyle
	},
	btnControl: {
		paddingRight: 10,
		paddingLeft: 10,
		backgroundColor: "transparent"
	},
	toSContainer: {
		flexDirection: "row",
		marginLeft: 16,
		marginRight: 16
	},
	link: {
		color: mainColor,
		marginTop: 18,
		marginLeft: 2,
		fontSize: 12
	}
});

export default SprayValet;
