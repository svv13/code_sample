import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import noImage from '../../assets/noImage.svg';
import magnifier from '../../assets/Magnifier.png';
import { communicationTitles } from '../../constants/communicationTitles';
import ChatBlock from '../CommunicationPage/components/ChatBlock/ChatBlock';
import Rating from '../../shared/Rating';
import Button from '../../shared/Button';
import conceptStore from '../Concepts/conceptStore';
import ConceptFile from '../../shared/ConceptFile/ConceptFile';
import link_file from '../../constants/link_file';
import projectStore from '../../stores/projectStore';
import globalStore from '../../stores/GlobalStore';
import { userRole } from '../../constants/userRole';
import edit_helpers from '../../helpers/validator/edit_helpers';
import communicationStore from '../../stores/communicationStore';

@observer
class ConceptView extends Component {
  state = {
    comments: [],
  };

  componentDidMount() {
    const { url } = this.props.match;
    const conceptId = url.split('/')[5];
    conceptStore.getConceptById(conceptId);
    this.getConceptMessages();
  }

  getConceptMessages = () => {
    const { url } = this.props.match;
    const conceptId = url.split('/')[5];
    const { detailedProject } = projectStore;
    communicationStore.openConversationOnOffer(detailedProject._id, conceptId);
  }

  addZero = (number, maxLength) => {
    number = number.toString();
    return number.length < maxLength
      ? this.addZero('0' + number, maxLength)
      : number;
  };

  render() {
    const { role } = globalStore.User;
    const { CONFIRMATION_WINNER } = communicationTitles;
    const isCustomer = globalStore.User.role === userRole.CUSTOMER;
    const { detailedProject } = projectStore;
    const { detailedConcept } = conceptStore;
    if (!detailedConcept || !detailedProject) return null;

    return (
      <div className="concept-wrapper">
        <div className="concept-header">
          <span className="concept-header-name">
            Konzepte #{this.addZero(detailedConcept._id, 3)}
          </span>
          <div className="center-side">
            {role !== userRole.COMPANY && (
              <div className="concept-header-architekt">
                <span>Architekt: </span>
                <span>{detailedConcept.accountId.login}</span>
              </div>
            )}
            <div className="concept-header-upload-date">
              <span>Datum des Uploads: </span>
              <span>
                {edit_helpers.edit_date(detailedConcept.creationDate)}
              </span>
            </div>
          </div>
          <div className="right-side">
            <div>
              {detailedConcept && (
                <Rating
                  value={detailedConcept.rating}
                  isActive={false}
                  star={
                    <svg
                      width="21"
                      height="20"
                      viewBox="0 0 21 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M14.339 11.9443L15.151 16.6789L10.899 14.4435L10.6663 14.3211L10.4337 14.4435L6.18166 16.6789L6.9937 11.9443L7.03815 11.6851L6.8498 11.5016L3.4079 8.14849L8.16206 7.45795L8.42403 7.4199L8.53982 7.18185L10.6663 2.81007L12.7929 7.18185L12.9087 7.4199L13.1706 7.45795L17.9248 8.14849L14.4829 11.5016L14.2945 11.6851L14.339 11.9443Z"
                        stroke="black"
                      />
                    </svg>
                  }
                />
              )}
            </div>
            <div className="back-to-list">
              <Link to={`/profile/project/${detailedProject._id}/concepts`}>
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="19.9999" r="16.1667" stroke="#999999" />
                  <path
                    d="M14.6967 14.6967L25.3033 25.3033M25.3033 14.6967L14.6967 25.3033"
                    stroke="#999999"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
        <div className="concept-body">
          <div className="concept-describe">
            <div className="concept-describe-image">
              <img
                src={detailedConcept.thumbnailUrl || noImage}
                alt="preview"
              />
            </div>
            <div className="concept-describe-attached-files">
              <ConceptFile
                link={detailedConcept.demoPdfUrl}
                name="Hochgeladenen Datein"
                icon={magnifier}
              />
              {detailedConcept.files.map((item) => (
                <ConceptFile
                  key={item._id}
                  name={item.fileName}
                  type={edit_helpers.getFileType(item.fileName)}
                  link={link_file + item.path}
                  icon={magnifier}
                />
              ))}
            </div>
            <div className="concept-describe-description">
              <p className="title">Beschreibung</p>
              <p>{detailedConcept.description}</p>
            </div>
            {!detailedProject.hasWinner && isCustomer && (
              <div className="concept-describe-winner-button">
                <Button
                  text={CONFIRMATION_WINNER}
                  icon={
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M13 17.9545C14.7072 17.6427 16.2301 15.7513 17.3145 12.9644C17.3718 12.9874 17.4344 13 17.5 13C19.122 13 20.4112 12.4517 21.275 11.3C22.1185 10.1753 22.5 8.54808 22.5 6.5V6H18.8626C18.923 5.34501 18.9643 4.67709 18.9848 4C18.9949 3.66871 19 3.33523 19 3H6C6 3.33523 6.00511 3.66871 6.01517 4C6.03573 4.67709 6.07696 5.34501 6.13745 6H2.5V6.5C2.5 8.54808 2.88148 10.1753 3.725 11.3C4.58881 12.4517 5.878 13 7.5 13C7.56556 13 7.62816 12.9874 7.68553 12.9644C8.76987 15.7513 10.2928 17.6427 12 17.9545V21H10V22H15V21H13V17.9545ZM16.1768 13.1062C17.194 10.728 17.8746 7.50721 17.9844 4H7.01564C7.12544 7.50721 7.80604 10.728 8.82324 13.1062C9.38069 14.4096 10.0193 15.4131 10.6787 16.0756C11.3356 16.7356 11.9504 17 12.5 17C13.0496 17 13.6644 16.7356 14.3213 16.0756C14.9807 15.4131 15.6193 14.4096 16.1768 13.1062ZM7.3389 11.9979C6.04671 11.9637 5.1361 11.5148 4.525 10.7C3.92607 9.90142 3.56682 8.68876 3.50844 7H6.2459C6.47222 8.81375 6.84715 10.5083 7.3389 11.9979ZM20.475 10.7C19.8639 11.5148 18.9533 11.9637 17.6611 11.9979C18.1529 10.5083 18.5278 8.81375 18.7541 7H21.4916C21.4332 8.68876 21.0739 9.90142 20.475 10.7Z"
                      />
                    </svg>
                  }
                  handleClick={() =>
                    conceptStore.setWinner(
                      detailedConcept._id,
                      detailedProject._id
                    )
                  }
                />
              </div>
            )}
          </div>
          <div className="concept-chat-block">
            <ChatBlock
              comments={this.state.comments}
              username={detailedConcept.accountId.login}
              projectId={+detailedProject._id}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default ConceptView;
