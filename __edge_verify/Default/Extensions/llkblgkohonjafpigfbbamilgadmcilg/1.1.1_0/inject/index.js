(function () {
    "use strict";

    class ObserverWrapper {
        constructor(target, callback, options) {
            this.target = target;
            this.callback = callback;
            this.options = options;
            this.observer = new MutationObserver(this.callback);
            this.init();
        }
        init() {
            this.observer.observe(this.target, this.options);
        }
        disconnect() {
            this.observer.disconnect();
        }
    }

    class DomObserver {
        constructor() {
            this.onObserverCallback = (mutationsList) => {
                for (let it = 0; it < mutationsList.length; it++) {
                    const {
                        type,
                        addedNodes,
                        removedNodes,
                        target
                    } = mutationsList[it];
                    if (type === "attributes") {
                        this.checkAndCallCallback("attributes", target);
                    } else if (type === "childList") {
                        addedNodes.forEach((added) => {
                            this.checkAndCallCallback("add", added);
                        });
                        removedNodes.forEach((removed) => {
                            this.checkAndCallCallback("remove", removed);
                        });
                    }
                }
            };
            this.observables = {
                add: [],
                remove: [],
                attributes: []
            };
            this.observerWrapper = new ObserverWrapper(
                document.documentElement || document.body,
                this.onObserverCallback,
                {
                    attributes: true,
                    childList: true,
                    subtree: true
                }
            );
        }
        static getInstance() {
            if (!this.instance) {
                this.instance = new DomObserver();
            }
            return this.instance;
        }
        subscribe(validate, callback, action) {
            this.observables[action].push({validate, callback});
        }
        checkAndCallCallback(action, target) {
            this.observables[action].forEach(({validate, callback}) => {
                try {
                    validate(target) && callback(target);
                } catch (err) {}
            });
        }
    }

    class UserPreference {
        constructor() {
            this.observables = [];
            this.onStorageChange = (changes) => {
                for (const key in changes) {
                    const storageChange = changes[key];
                    this.observables.forEach(({preference, onChange}) => {
                        if (preference === key) {
                            onChange(storageChange.newValue);
                        }
                    });
                }
            };
            this.init();
        }
        init() {
            chrome.storage.onChanged.addListener(this.onStorageChange);
        }
        subscribe(preference, onChange) {
            this.observables.push({preference, onChange});
        }
        async get(preference, defaultValue) {
            return new Promise((resolve, reject) => {
                chrome.storage.sync.get([preference], (result) => {
                    if (chrome.runtime.lastError) {
                        reject(Error(chrome.runtime.lastError.message));
                    }
                    const value = result[preference];
                    if (typeof value === "undefined") {
                        this.set(preference, defaultValue);
                        resolve(defaultValue);
                    } else {
                        resolve(value);
                    }
                });
            });
        }
        async set(preference, value) {
            return new Promise((resolve, reject) => {
                chrome.storage.sync.set({[preference]: value}, () => {
                    chrome.runtime.lastError
                        ? reject(Error(chrome.runtime.lastError.message))
                        : resolve();
                });
            });
        }
    }

    class BaseModel {
        constructor() {
            this.userPreference = new UserPreference();
            this.domObserver = DomObserver.getInstance();
        }
        async getPreference(preference, defaultValue) {
            return await this.userPreference.get(preference, defaultValue);
        }
        async setPreference(preference, value) {
            return await this.userPreference.set(preference, value);
        }
        async subscribeToPreference(preference, defaultValue, onChange) {
            this.userPreference.subscribe(preference, onChange);
            onChange(await this.getPreference(preference, defaultValue));
        }
        onDomAttributeChange(validate, callback) {
            this.domObserver.subscribe(validate, callback, "attributes");
        }
        onDomAdd(validate, callback) {
            this.domObserver.subscribe(validate, callback, "add");
        }
        onDomRemove(validate, callback) {
            this.domObserver.subscribe(validate, callback, "remove");
        }
    }

    const SECTION_COMPLETE_TOGGLE_ENABLED = {
        key: "SECTION_COMPLETE_TOGGLE_ENABLED",
        default: true
    };
    const EXTENDED_VIDEO_PLAYBACK_RATE_ENABLED = {
        key: "EXTENDED_VIDEO_PLAYBACK_RATE_ENABLED",
        default: true
    };
    const PREFERRED_VIDEO_PLAYBACK_RATE = {
        key: "PREFERRED_VIDEO_PLAYBACK_RATE",
        default: 1
    };
    const PICTURE_IN_PICTURE_ENABLED = {
        key: "PICTURE_IN_PICTURE_ENABLED",
        default: true
    };
    const EXTENDED_VIDEO_PLAYBACK_RATES = [
        0.25,
        0.5,
        0.75,
        1,
        1.25,
        1.5,
        1.75,
        2,
        2.25,
        2.5,
        2.75,
        3
    ];

    function getLocalMessage(messageName) {
        return chrome.i18n.getMessage(messageName) || messageName;
    }

    class SectionCompleteToggler extends BaseModel {
        constructor() {
            super();
            this.permitted = true;
            this.setPermition = (permission) => {
                this.permitted = permission;
            };
            this.validateCurriculumContainer = (element) => {
                return this.permitted &&
                    element.nodeName === "DIV" &&
                    element.querySelector(
                        "div[data-purpose='curriculum-section-container']"
                    )
                    ? true
                    : false;
            };
            this.actionOnCurriculumContainer = (element) => {
                const sections = element.querySelectorAll(
                    "div[data-purpose^='section-panel-']"
                );
                sections.forEach((section) => {
                    this.attemptToAddTogglerToSection(
                        section.querySelector("div[role='group']")
                    );
                });
            };
            this.attemptToAddTogglerToSection = (section) => {
                if (this.getSectionToggler(section)) {
                    return;
                }
                section.children[0].insertAdjacentHTML(
                    "beforebegin",
                    `<div class='up-toggle-section-completed' data-purpose='up-toggle-section-completed'></div>`
                );
                section
                    .querySelector(
                        `div[data-purpose='up-toggle-section-completed']`
                    )
                    .addEventListener("click", this.onToggleCompleted);
                this.updateSectionTogglerContent(section);
            };
            this.getSectionToggler = (element) => {
                return element.parentNode.querySelector(
                    'div[data-purpose="up-toggle-section-completed"]'
                );
            };
            this.onToggleCompleted = (e) => {
                const section = e.target.parentNode;
                const {lessons, allCompleted} = this.analyze(section);
                const newStatus = !allCompleted;
                lessons.forEach((input) => {
                    if (input.checked !== newStatus) {
                        input.click();
                    }
                });
                this.updateSectionTogglerContent(section);
            };
            this.updateSectionTogglerContent = (section) => {
                const {allCompleted} = this.analyze(section);
                const togglerElement = this.getSectionToggler(section);
                const toggleText = getLocalMessage(
                    allCompleted ? "mark_all_uncompleted" : "mark_all_completed"
                );
                togglerElement.innerText = toggleText;
            };
            this.init();
        }
        async init() {
            await this.subscribeToPreference(
                SECTION_COMPLETE_TOGGLE_ENABLED.key,
                SECTION_COMPLETE_TOGGLE_ENABLED.default,
                this.setPermition
            );
            this.onDomAdd(
                this.validateCurriculumContainer,
                this.actionOnCurriculumContainer
            );
        }
        analyze(section) {
            const allCheckboxes = section.querySelectorAll(
                "input[type='checkbox']"
            );
            const lessons = [];
            for (let it = 0; it < allCheckboxes.length; it++) {
                lessons.push(allCheckboxes[it]);
            }
            const completedCount = lessons.filter((input) => input.checked)
                .length;
            return {
                lessons,
                total: lessons.length,
                allCompleted: completedCount === lessons.length
            };
        }
    }

    const initCourseContent = () => {
        new SectionCompleteToggler();
    };

    class VideoPlaybackRate extends BaseModel {
        constructor() {
            super();
            this.permitted = true;
            this.allRates = EXTENDED_VIDEO_PLAYBACK_RATES;
            this.preferredVideoPlaybackRate = 1;
            this.setPermition = (permission) => {
                this.permitted = permission;
            };
            this.setPreferredVideoPlaybackRate = (rate) => {
                this.preferredVideoPlaybackRate = parseFloat(rate);
            };
            this.parseRate = (rate) => {
                return parseFloat(rate.split("x")[0]);
            };
            this.convertRate = (rate) => {
                return rate + "x";
            };
            this.validate = (element) => {
                return this.permitted && element.nodeName === "VIDEO";
            };
            this.action = (videoEl) => {
                try {
                    this.videoPlayer = videoEl;
                    this.videoPlayer.addEventListener("ratechange", (e) => {
                        this.updatePlaybackRate();
                    });
                } catch (err) {
                    console.warn("Error occured on PlaybackRate modification");
                }
            };
            this.validatePlaybackRateBtn = (element) => {
                return (
                    this.permitted &&
                    element.nodeName === "DIV" &&
                    !!element.querySelector(
                        "button[data-purpose='playback-rate-button']"
                    )
                );
            };
            this.actionOnPlaybackRateBtn = (element) => {
                this.updatePlaybackRate();
                this.addNewPlaybackRates(element);
            };
            this.updatePlaybackRate = () => {
                const buttonRateIndicator = document.querySelector(
                    "button[data-purpose='playback-rate-button']"
                );
                if (!buttonRateIndicator) {
                    return;
                }
                this.updatePlaybackButtonContent(buttonRateIndicator);
                if (
                    this.videoPlayer &&
                    this.videoPlayer.playbackRate !==
                        this.preferredVideoPlaybackRate
                ) {
                    this.videoPlayer.playbackRate = this.preferredVideoPlaybackRate;
                }
                this.addPlaybackRateToListIfNotExists(
                    this.preferredVideoPlaybackRate
                );
            };
            this.updatePlaybackButtonContent = (buttonRateIndicator) => {
                const newInnerText =
                    this.preferredVideoPlaybackRate.toString() + "x";
                let nestedButton = buttonRateIndicator;
                while (nestedButton.children.length > 0) {
                    nestedButton = nestedButton.children[0];
                }
                if (nestedButton.innerText) {
                    nestedButton.innerText = newInnerText;
                } else if (buttonRateIndicator.innerText) {
                    buttonRateIndicator.innerText = newInnerText;
                }
            };
            this.addNewPlaybackRates = (element) => {
                const playbackRateMenuUl = element.querySelector(
                    "ul[data-purpose='playback-rate-menu']"
                );
                if (!playbackRateMenuUl) {
                    return;
                }
                const allLiRates = playbackRateMenuUl.querySelectorAll("li");
                const rateLiTemplate = allLiRates[0].cloneNode(true);
                playbackRateMenuUl.innerHTML = "";
                this.allRates.forEach((rate) => {
                    const itemToAdd = rateLiTemplate.cloneNode(true);
                    itemToAdd.addEventListener(
                        "click",
                        this.handleChangeVideoPlaybackRate
                    );
                    itemToAdd.querySelector(
                        "span"
                    ).innerText = this.convertRate(rate);
                    playbackRateMenuUl.appendChild(itemToAdd);
                });
                this.markPreferredRateActive();
            };
            this.handleChangeVideoPlaybackRate = (e) => {
                const newRate = this.parseRate(e.target.innerText);
                if (isNaN(newRate)) {
                    console.error(
                        "Change video playback rate",
                        e.target.innerText,
                        "not a number"
                    );
                    return;
                }
                this.preferredVideoPlaybackRate = newRate;
                this.updatePlaybackRate();
                this.markPreferredRateActive();
                this.setPreference(PREFERRED_VIDEO_PLAYBACK_RATE.key, newRate);
            };
            this.markPreferredRateActive = () => {
                const allRates = document.querySelectorAll(
                    "ul[data-purpose='playback-rate-menu'] li button"
                );
                allRates.forEach((el) => {
                    const rate = this.parseRate(el.innerText);
                    el.setAttribute("aria-checked", "false");
                    if (rate === this.preferredVideoPlaybackRate) {
                        el.setAttribute("aria-checked", "true");
                    }
                });
            };
            this.addPlaybackRateToListIfNotExists = (newPlaybackRate) => {
                if (!this.allRates.includes(newPlaybackRate)) {
                    this.allRates.push(newPlaybackRate);
                    this.allRates.sort((a, b) => a - b);
                }
            };
            this.init();
        }
        async init() {
            await this.subscribeToPreference(
                EXTENDED_VIDEO_PLAYBACK_RATE_ENABLED.key,
                EXTENDED_VIDEO_PLAYBACK_RATE_ENABLED.default,
                this.setPermition
            );
            await this.subscribeToPreference(
                PREFERRED_VIDEO_PLAYBACK_RATE.key,
                PREFERRED_VIDEO_PLAYBACK_RATE.default,
                this.setPreferredVideoPlaybackRate
            );
            this.onDomAdd(this.validate, this.action);
            this.onDomAdd(
                this.validatePlaybackRateBtn,
                this.actionOnPlaybackRateBtn
            );
        }
    }

    class PictureInPicture extends BaseModel {
        constructor() {
            super();
            this.permitted = true;
            this.setPermition = (permission) => {
                this.permitted =
                    permission && "pictureInPictureEnabled" in document;
            };
            this.validate = (element) => {
                return this.permitted && element.nodeName === "VIDEO";
            };
            this.action = async (videoEl) => {
                const prevState = this.pipWindow?.state || "None";
                const immediatelyOpenPip = prevState === "ClosedOnVideoFinish";
                this.pipWindow = new PipWindow(videoEl, {immediatelyOpenPip});
            };
            this.actionOnRemove = async (videoEl) => {
                this.exitPipWindow();
            };
            this.exitPipWindow = () => {
                this.pipWindow?.exit("ClosedOnVideoFinish");
            };
            this.init();
        }
        async init() {
            await this.subscribeToPreference(
                PICTURE_IN_PICTURE_ENABLED.key,
                PICTURE_IN_PICTURE_ENABLED.default,
                this.setPermition
            );
            this.onDomAdd(this.validate, this.action);
            this.onDomRemove(this.validate, this.actionOnRemove);
        }
    }
    class PipWindow {
        constructor(videoEl, config) {
            this.state = "Waiting";
            this.exit = (exitState) => {
                this.requestPipExit(exitState);
                this.pipButton?.remove();
            };
            this.init = (config) => {
                this.videoPlayer.addEventListener(
                    "loadedmetadata",
                    this.updatePipButtonState
                );
                this.videoPlayer.addEventListener(
                    "emptied",
                    this.updatePipButtonState
                );
                this.videoPlayer.addEventListener(
                    "enterpictureinpicture",
                    () => {
                        this.state = "Open";
                    }
                );
                this.videoPlayer.addEventListener(
                    "leavepictureinpicture",
                    () => {
                        if (this.state === "Open") {
                            this.state = "ManuallyClosed";
                        }
                    }
                );
                this.addPipButton();
                if (config.immediatelyOpenPip) {
                    this.immediatelyRequestPip();
                }
            };
            this.immediatelyRequestPip = () => {
                this.videoPlayer.onloadedmetadata = async () => {
                    await this.requestPipOpen().catch((err) => {
                        console.log("Could not open PiP");
                        document.addEventListener(
                            "click",
                            this.requestPipOpenOnUserGesture
                        );
                    });
                };
            };
            this.requestPipOpenOnUserGesture = () => {
                document.removeEventListener(
                    "click",
                    this.requestPipOpenOnUserGesture
                );
                this.requestPipOpen();
            };
            this.requestPipOpen = async () => {
                this.videoPlayer.requestPictureInPicture &&
                    (await this.videoPlayer.requestPictureInPicture());
            };
            this.requestPipExit = async (exitState) => {
                if (this.state === "Open") {
                    this.state = exitState;
                    document.exitPictureInPicture &&
                        (await document.exitPictureInPicture());
                }
            };
            this.updatePipButtonState = () => {
                if (!this.pipButton) {
                    return;
                }
                this.pipButton.disabled = !!(
                    this.videoPlayer.readyState === 0 ||
                    !document.pictureInPictureEnabled ||
                    this.videoPlayer.disablePictureInPicture
                );
            };
            this.addPipButton = () => {
                const playPauseButton =
                    document.querySelector(
                        "button[data-purpose='play-button']"
                    ) ||
                    document.querySelector(
                        "button[data-purpose='pause-button']"
                    );
                if (!playPauseButton) {
                    setTimeout(this.addPipButton, 1000);
                    return;
                }
                if (
                    document.querySelector("button[data-purpose='pip-button']")
                ) {
                    return;
                }
                this.pipButton = playPauseButton.cloneNode(true);
                this.pipButton.addEventListener("click", this.togglePip);
                this.pipButton.classList.add("up-pip-button");
                this.pipButton.setAttribute("data-purpose", "pip-button");
                this.pipButton.setAttribute("aria-label", "");
                this.pipButton.setAttribute("aria-labelledby", "");
                this.pipButton.setAttribute("aria-describedby", "");
                this.pipButton.innerHTML = "";
                const pipSpan = document.createElement("span");
                this.pipButton.appendChild(pipSpan);
                pipSpan.style.background = `url("${chrome.runtime.getURL(
                    `icons/pip-icon.png`
                )}") center center no-repeat`;
                const videoControls = document.querySelector(
                    "div[data-purpose='video-controls']"
                );
                videoControls.appendChild(this.pipButton);
                this.updatePipButtonState();
            };
            this.togglePip = async () => {
                if (!this.pipButton) {
                    return;
                }
                this.pipButton.disabled = true;
                try {
                    if (this.videoPlayer !== document.pictureInPictureElement) {
                        this.requestPipOpen();
                    } else {
                        this.requestPipExit("ManuallyClosed");
                    }
                } catch (error) {
                    console.log(`UdemyPlus Picture in Picture error! ${error}`);
                } finally {
                    this.pipButton.disabled = false;
                }
            };
            this.videoPlayer = videoEl;
            this.init(config);
        }
    }

    class VideoNavigator extends BaseModel {
        constructor() {
            super();
            this.permitted = true;
            this.checkOnKeyDown = (e) => {
                if (e.ctrlKey) {
                    if (e.key === "ArrowLeft") {
                        this.handleNavigateToPrevious();
                    }
                    if (e.key === "ArrowRight") {
                        this.handleNavigateToNext();
                    }
                }
            };
            this.handleNavigateToPrevious = () => {
                const item = document.querySelector("#go-to-previous-item");
                item && item.click();
            };
            this.handleNavigateToNext = () => {
                const item = document.querySelector("#go-to-next-item");
                item && item.click();
            };
            this.init();
        }
        async init() {
            if (this.permitted) {
                document.addEventListener("keydown", this.checkOnKeyDown);
            }
        }
    }

    const initVideoPlayer = () => {
        new VideoPlaybackRate();
        new PictureInPicture();
        new VideoNavigator();
    };

    initCourseContent();
    initVideoPlayer();
    chrome.runtime.sendMessage({message: "activate_icon"});
})();
