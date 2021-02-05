import React, { Component, FormEvent } from "react";
import SubNavbar from "../../Shared/Navbars/SubNavbar";
import AvatarIconWithPicker from "../../Shared/AvatarIconWithPicker";
import ProfileStore from "../../Stores/ProfileStore";
import { observer } from "mobx-react";
import { Form, FormControlProps } from "react-bootstrap";
import Toggle from "../../Shared/Checkbox";
import YellowButton from "../../Shared/Buttons/YellowButton";
import { BsPrefixProps, ReplaceProps } from "react-bootstrap/helpers";
import AuthStore from "../../Stores/AuthStore";
import { Redirect } from "react-router";
import { defaultAvatar } from "../../Interfaces/OtherInterfaces";

@observer
export default class ProfileSettings extends Component {
  fileInput: React.RefObject<any> = React.createRef();
  plusButton: React.RefObject<any> = React.createRef();

  componentDidMount(): any {
    const button = this.plusButton.current;
    const input = this.fileInput.current;
    if (button) {
      button.addEventListener(
        "click",
        (e: React.MouseEvent<HTMLElement>) => {
          if (input) {
            input.click();
          }
        },
        false
      );
    }
    if (!AuthStore.isLogged) return <Redirect to={"/"} />;
    ProfileStore.getProfileData();
  }

  getFile = () => {
    const fileReader = new FileReader();
    ProfileStore.avatarFile = this.fileInput.current.files[0];
    fileReader.readAsDataURL(this.fileInput.current.files[0]);
    fileReader.onloadend = (event: any) => {
      ProfileStore.changeProfileData("avatar_url", event.target.result);
    };
  };

  changeData = async (
    event: FormEvent<
      ReplaceProps<"input", BsPrefixProps<"input"> & FormControlProps>
    >
  ) => {
    const { id, value = "" } = event.currentTarget;
    if (id) {
      ProfileStore.changeProfileData(id, value);
    }
    if (id === "phone" || id === "email") {
      ProfileStore.phoneValidation(id, value);
    }
  };

  changeCheckboxes = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked = false } = event.currentTarget;
    ProfileStore.changeProfileData(name, checked);
  };
  saveChanges = async () => {
    await ProfileStore.saveProfileData();
  };

  componentWillUnmount(): void {
    ProfileStore.success = false;
  }

  render() {
    const {
      first_name,
      last_name,
      email,
      phone,
      notification_sms,
      notification_email,
      notification_push,
      notification_text_magic,
      avatar_url
    } = ProfileStore.profile;
    return (
      <div className={"settings_container"}>
        <SubNavbar active={0} />
        <div className="container">
          <h1>Profile settings</h1>
          <h4>Account</h4>
          <AvatarIconWithPicker
            inputRef={this.fileInput}
            buttonRef={this.plusButton}
            onChange={this.getFile}
            src={avatar_url || defaultAvatar}
          />
          <Form>
            <Form.Row>
              <Form.Group controlId="first_name">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="first name"
                  value={first_name}
                  onChange={this.changeData}
                />
              </Form.Group>

              <Form.Group controlId="last_name">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="last name"
                  value={last_name}
                  onChange={this.changeData}
                />
              </Form.Group>
            </Form.Row>
            <Form.Row>
              <Form.Group controlId="email">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="email"
                  onBlur={ProfileStore.inputFieldsValidation}
                  value={email}
                  onChange={this.changeData}
                />
                <span
                  className={`inline_error ${
                    ProfileStore.inlineErrors.email ? "visible" : "invisible"
                  }`}
                >
                  Please enter valid email
                </span>
              </Form.Group>

              <Form.Group controlId="phone">
                <Form.Label>Phone number</Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="phone"
                  onBlur={ProfileStore.inputFieldsValidation}
                  value={phone}
                  onChange={this.changeData}
                />
                <span
                  className={`inline_error ${
                    ProfileStore.inlineErrors.phone ? "visible" : "invisible"
                  }`}
                >
                  Please enter only numbers
                </span>
              </Form.Group>
            </Form.Row>
            <h4>Notifications</h4>
            <Form.Group controlId={"sms"} className={"notifications_switcher"}>
              <Form.Label>SMS</Form.Label>
              <Toggle
                checked={notification_sms}
                onChange={this.changeCheckboxes}
                name={"notification_sms"}
              />
            </Form.Group>
            <Form.Group
              controlId={"email"}
              className={"notifications_switcher"}
            >
              <Form.Label>Email</Form.Label>
              <Toggle
                checked={notification_email}
                onChange={this.changeCheckboxes}
                name={"notification_email"}
              />
            </Form.Group>
            <Form.Group controlId={"push"} className={"notifications_switcher"}>
              <Form.Label>Push</Form.Label>
              <Toggle
                checked={notification_push}
                onChange={this.changeCheckboxes}
                name={"notification_push"}
              />
            </Form.Group>
          </Form>
          <div>
            <input
              type="checkbox"
              className="form-check-input styled-checkbox"
              id="notification_text_magic"
              name="notification_text_magic"
              checked={notification_text_magic}
              onChange={this.changeCheckboxes}
            />
            <label
              className="form-check-label"
              htmlFor="notification_text_magic"
            >
              I agree to receive text-based (SMS) marketing
            </label>
          </div>
          <span
            className={`inline_message ${
              ProfileStore.success && !ProfileStore.uploadError
                ? "visible"
                : "invisible"
            }`}
          >
            Your data is successfully saved!
          </span>
          {ProfileStore.showNotificationError && (
            <span className={"inline_error"}>
              It’s best to pick at least one notification so we can notify you
              of any changes
            </span>
          )}
          {ProfileStore.uploadError && (
            <span className={"inline_error"}>{ProfileStore.uploadError}</span>
          )}
          <YellowButton
            onClick={this.saveChanges}
            value={"save"}
            spinner={ProfileStore.isLoading}
            disabled={
              Object.values(ProfileStore.inlineErrors).includes(true) ||
              ProfileStore.showNotificationError
            }
          />
        </div>
      </div>
    );
  }
}
