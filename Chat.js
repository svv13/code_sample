import React, { Component } from "react";
import {
	FlatList,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	View
} from "react-native";
import { observer } from "mobx-react";
import BookingDescription from "./BookingDescription";
import Message from "./Message";
import messengerStore from "../stores";
import InputFieldChat from "../../../shared/InputFieldChat";
import moment from "moment";
import Colors from "../../../constants/styles/Colors";

const keyboardVerticalOffset = Platform.OS === "ios" ? 80 : 0;

@observer
class Chat extends Component {
	componentWillUnmount() {
		messengerStore.resetChat();
		if (messengerStore.socketInst) {
			messengerStore.socketInst.close();
			messengerStore.socketInst = null;
		}
	}

	renderMessages(messages) {
		return messages
			.slice()
			.reverse()
			.map((item, index) => {
				const previous =
					messages.length > [index - 1] ? messages[index - 1] : null;
				const current = item;
				const next = messages.length > [index + 1] ? messages[index + 1] : null;
				const currentMoment = moment(current.created_at);
				let showDate = false;

				if (previous) {
					let previousMoment = moment(previous.created_at);
					let previousDuration = moment.duration(
						currentMoment.diff(previousMoment)
					);

					if (previousDuration.as("days") >= 1) {
						showDate = true;
					}
				}

				if (next) {
					let nextMoment = moment(next.created_at);
					let nextDuration = moment.duration(nextMoment.diff(currentMoment));
					if (!previous && nextDuration.as("days") >= 1) {
						showDate = true;
					}
				}

				if (index === 0) showDate = true;

				return { ...item, showDate };
			})
			.reverse();
	}

	render() {
		const {
			chat,
			messengerFields,
			onTyping,
			onSend,
			componentState,
			getMoreMessages,
			messages
		} = messengerStore;

		return (
			<View style={style.container}>
				<BookingDescription {...chat.appointment} />
				<KeyboardAvoidingView
					behavior="position"
					keyboardVerticalOffset={keyboardVerticalOffset}
					contentContainerStyle={{ flex: 1 }}
					style={{ flex: 1 }}
				>
					<View style={style.containerMessages}>
						<FlatList
							data={this.renderMessages(messages)}
							extraData={componentState.loadMore}
							keyExtractor={item => item.id + ""}
							renderItem={({ item }) => (
								<Message {...item} key={item._id} isShowDate={item.showDate} />
							)}
							inverted={true}
							onEndReachedThreshold={0.1}
							onEndReached={getMoreMessages}
						/>
					</View>
					{chat.is_active ? (
						<View style={style.fieldContainer}>
							<InputFieldChat
								value={messengerFields.newMessage}
								onChangeText={onTyping}
								onSend={onSend}
							/>
						</View>
					) : null}
				</KeyboardAvoidingView>
			</View>
		);
	}
}

const style = StyleSheet.create({
	container: {
		flex: 1,
		width: "100%",
		height: "100%",
		backgroundColor: "white"
	},
	containerMessages: {
		flex: 4,
		paddingLeft: 16,
		paddingRight: 16,
		paddingTop: 10,
		width: "100%",
		backgroundColor: Colors.grey_background
	},
	fieldContainer: {
		justifyContent: "flex-end",
		height: 60,
		width: "100%"
	}
});

export default Chat;
