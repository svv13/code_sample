import React, { ChangeEvent, Component } from "react";
import Logo from "../../assets/Logo.svg";
import LoginInput from "../../Shared/LoginInput";
import YellowButton from "../../Shared/Buttons/YellowButton";
import { observer } from "mobx-react";
import { Link } from "react-router-dom";
import { RouterProps } from "react-router";
import PasswordRecoveryStore from "../../Stores/PasswordRecoveryStore";

@observer
export default class PasswordRecovery extends Component<RouterProps> {
  state = {
    recoveryFailed: false
  };
  resetPassword = async () => {
    this.setState({ recoveryFailed: false });
    const success = await PasswordRecoveryStore.resetPassword();
    if (success) {
      return this.props.history.push("/password_recovery_success");
    }
    this.setState({ recoveryFailed: true });
  };
  changeHandle = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({ recoveryFailed: false });
    PasswordRecoveryStore.changeResetEmail(event.target.value);
  };
  componentDidMount(): void {
    const navbar = document.querySelector("nav");
    if (navbar) navbar.classList.add("hide");
  }
  componentWillUnmount(): void {
    const navbar = document.querySelector("nav");
    if (navbar) navbar.classList.remove("hide");
  }

  render() {
    return (
      <div className={"d-flex min-vh-100"}>
        <div className={"col-md-7 col-12"}>
          <div id={"forg_password"}>
            <div className={"logo_container mb-5"}>
              <Link
                to={"/"}
                onClick={(e: any) => {
                  e.preventDefault();
                  this.props.history.push("/");
                }}
              >
                <img src={Logo} alt={"Logo"} />
              </Link>
            </div>
            <div
              className={
                "content_container flex-column justify-content-center align-items-center min_height-100 "
              }
            >
              <h1 className={"text-capitalize text-center font-weight-bold "}>
                Password recovery
              </h1>
              <div className={"form-group mt-5"}>
                <LoginInput
                  type={"email"}
                  placeholder={"Enter your email"}
                  name={"email"}
                  autoComplete={"email"}
                  onChange={this.changeHandle}
                  onBlur={event =>
                    PasswordRecoveryStore.inputFieldsValidation(event)
                  }
                  value={PasswordRecoveryStore.resetPasswordEmail}
                />
                <span
                  className={`inline_error ${
                    PasswordRecoveryStore.inlinePasswordRecoveryErrors.email
                      ? "visible"
                      : "invisible"
                  }`}
                >
                  Please enter valid email
                </span>
                <span
                  className={`inline_error ${
                    this.state.recoveryFailed ? "visible" : "invisible"
                  }`}
                >
                  Password recovery operation is failed. Please try again later.
                </span>
              </div>
              <YellowButton
                onClick={this.resetPassword}
                value={"reset password"}
                spinner={PasswordRecoveryStore.isLoading}
                disabled={
                  !PasswordRecoveryStore.resetPasswordEmail ||
                  PasswordRecoveryStore.inlinePasswordRecoveryErrors.email
                }
              />
              <div className={"link_container"}>
                <Link to={"/login"} className={"agreements_link"}>
                  back to login
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className={"col-md-5 col-0 p-0"}>
          <div id={"yellow_background_with_picture"}></div>
        </div>
      </div>
    );
  }
}
