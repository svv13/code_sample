import React, { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { briefingTitle, briefingGardenTitle } from '../../constants/titles';
import projectStore from '../../stores/projectStore';
import house from '../../assets/house.svg';
import skyscraper from '../../assets/skyscraper.svg';
import office from '../../assets/office.svg';
import special from '../../assets/special.svg';
import garden from '../../assets/garden.svg';
import Work from './components/Work';
import Style from './components/Style';
import Question from './components/Question';
import Options from './components/Options';
import Roof from './components/Roof';
import Requirements from './components/Requirements';
import Data from './components/Data';
import Further from './components/Further';
import AdditionalInfo from './components/AdditionalInfo';
import globalStore from '../../stores/GlobalStore';
import { userRole } from '../../constants/userRole';
import transactionStore from '../../stores/transactionStore';
import edit_helpers from '../../helpers/validator/edit_helpers';
import link_file from '../../constants/link_file';
import download from '../../assets/download.svg';
import ConceptFile from '../../shared/ConceptFile/ConceptFile';
import Button from '../../shared/Button';

const getDimensions = ele => {
  const { height } = ele.getBoundingClientRect();
  const offsetTop = ele.offsetTop;
  const offsetBottom = offsetTop + height;

  return {
    height,
    offsetTop,
    offsetBottom,
  };
};

const scrollTo = ele => {
  try {
    ele.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  } catch (error) {
    console.warn('element for scroll not found', error);
  }
};

const Briefing = observer(() => {
  const [visibleSection, setVisibleSection] = useState();
  const { detailedProject } = projectStore;

  const workRef = useRef(null);
  const styleRef = useRef(null);
  const questionRef = useRef(null);
  const optionsRef = useRef(null);
  const roofRef = useRef(null);
  const requirementsRef = useRef(null);
  const furtherRef = useRef(null);
  const dataRef = useRef(null);
  const fileRef = useRef(null);
  const sectionRefs = [
    { section: 'work', ref: workRef },
    { section: 'style', ref: styleRef },
    { section: 'questions-about-the-room-program', ref: questionRef },
    { section: 'options', ref: optionsRef },
    { section: 'roof-type-construction', ref: roofRef },
    {
      section: 'further-requirements-for-the-architects',
      ref: requirementsRef,
    },
    { section: 'further-information', ref: furtherRef },
    { section: 'file-information', ref: fileRef },
    { section: 'data', ref: dataRef },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 28;

      const selected = sectionRefs.find(({ section, ref }) => {
        const ele = ref.current;
        if (ele) {
          const { offsetBottom, offsetTop } = getDimensions(ele);
          return scrollPosition > offsetTop && scrollPosition < offsetBottom;
        }
        return null;
      });

      if (selected && selected.section !== visibleSection) {
        setVisibleSection(selected.section);
      } else if (!selected && visibleSection) {
        setVisibleSection(undefined);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [visibleSection, sectionRefs]);

  const handleClick = value => {
    let pos = sectionRefs
      .map(function(e) {
        return e.section;
      })
      .indexOf(value);
    scrollTo(sectionRefs[pos].ref.current);
  };

  const checkStatus = status => {
    return status ? (
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0.75 6.75002L3.75 9.75001L11.25 2.25002"
          stroke="#219653"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ) : (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="no">
        <path
          d="M6.75 6.75L17.25 17.25M17.25 6.75L6.75 17.25"
          stroke="#E86D00"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  const checkType = type => {
    switch (type) {
      case 'CLOSED':
        return 'Geschlosse';
      case 'WHATEVER':
        return 'Egal';
      case 'OPENED':
        return 'Offene';

      default:
        break;
    }
  };

  const checkCategory = category => {
    switch (category) {
      case 'BUILDING':
        return 'Neubau';
      case 'RENOVATION':
        return 'Anbau & Aufbau';
      case 'GARDEN':
        return 'Garten- & Landschaftsbau';
      case 'SPECIAL':
        return 'Spezialprojekt';
      default:
        break;
    }
  };

  const checkProjectType = type => {
    switch (type) {
      case 'Einfamilienhaus':
        return house;
      case 'Mehrfamilienhaus':
        return skyscraper;
      case 'Gewerbe':
        return office;
      case 'Spezialprojekt':
        return special;
      case 'Garten- & Landschaftsbau':
        return garden;
      default:
        break;
    }
  };
  const { role } = globalStore.User;
  if (!detailedProject) return <div>Laden...</div>;
  const { details } = detailedProject;
  const isSpecialOrGarden =
    detailedProject.type === 'Spezialprojekt' ||
    detailedProject.type === 'Garten- & Landschaftsbau';
  const isBuilding = detailedProject.type === 'BUILDING';
  const briefingRightSideNav = isSpecialOrGarden
    ? briefingGardenTitle
    : briefingTitle;
  const additionalInfoFiles = detailedProject.additionalInfo? detailedProject.additionalInfo.files : [];
  const briefingFiles = [
        ...additionalInfoFiles,
        ...detailedProject.details.files,
      ]
  return (
    <div className="briefing">
      <div className="left-side">
        <div className="nav-bar">
          {briefingRightSideNav.map((item, index) => (
            <div
              key={item.title}
              className={`link ${
                item.value === visibleSection ? 'active' : 'not-active'
              } ${item.title}`}>
              <span onClick={() => handleClick(item.value)}>{item.title}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="right-side">
        <Work
          type={detailedProject.type}
          category={detailedProject.category}
          checkCategory={checkCategory}
          checkProjectType={checkProjectType}
          id="work"
          ref={workRef}
        />
        {detailedProject.style.length ? (
          <Style style={detailedProject.style} id="style" ref={styleRef} />
        ) : null}
        {!isSpecialOrGarden ? (
          <Question
            numOfFloors={details.numOfFloors}
            numOfSquares={details.numOfSquares}
            numOfRooms={details.numOfRooms}
            numOfBathrooms={details.numOfBathrooms}
            numOfGuestWCBat={details.numOfGuestWCBat}
            numOfParkings={details.numOfParkings}
            checkStatus={checkStatus}
            hasUndergroundParking={details.hasUndergroundParking}
            hasBasement={details.hasBasement}
            hasTerrace={details.hasTerrace}
            hasWinterGarden={details.hasWinterGarden}
            constructionType={details.constructionType}
            area={details.area}
            id="questions-about-the-room-program"
            ref={questionRef}
          />
        ) : null}
        {isBuilding ? (
          <Options
            checkType={checkType}
            checkStatus={checkStatus}
            kitchenType={details.kitchenType}
            roomDesign={details.roomDesign}
            hasAtrium={details.hasAtrium}
            hasGallery={details.hasGallery}
            id="options"
            ref={optionsRef}
            projectType={detailedProject.type}
          />
        ) : null}
        {isBuilding ? (
          <Roof
            skeletonType={details.skeletonType}
            roofType={details.roofType}
            id="roof-type-construction"
            ref={roofRef}
            projectType={detailedProject.type}
          />
        ) : null}
        <Requirements
          requirementsForArchitect={
            details.requirementsForArchitect || details.requirements
          }
          id="further-requirements-for-the-architects"
          ref={requirementsRef}
        />
        {detailedProject.additionalInfo ? (
          <AdditionalInfo
            infoData={detailedProject.additionalInfo}
            id="further-information"
            ref={furtherRef}
          />
        ) : role === userRole.CUSTOMER ? (
          <Further
            id="further-information"
            ref={furtherRef}
            handleShow={transactionStore.openModal}
          />
        ) : null}
        {briefingFiles.length ? (
          <div id="file-information" ref={fileRef}>
            <h3>Bereits vorhandene Unterlagen/Pläne/Fotos</h3>
            <div className="list-data">
              {briefingFiles.map((item) => (
                <ConceptFile
                  key={item._id}
                  name={item.fileName}
                  type={edit_helpers.getFileType(item.fileName)}
                  link={link_file + item.path}
                  icon={download}
                  size={edit_helpers.sizeToKB(item.size)}
                />
              ))}
            </div>
          </div>
        ) : null}
        {role === userRole.CUSTOMER? (<Button
          text="DATEI HINZUFÜGEN"
          handleClick={(evt) => transactionStore.openModal(evt, true)}
        />) : null}
        <Data
          id="data"
          ref={dataRef}
          projectOptions={detailedProject.projectOptions}
          paymentProcessing={detailedProject.paymentProcessing}
          checkStatus={checkStatus}
          tariffName={detailedProject.tariffId.name}
        />
      </div>
    </div>
  );
});

export default Briefing;
