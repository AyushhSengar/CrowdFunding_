/* =========================================================
   FIREBASE IMPORTS
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";


import {
    browserSessionPersistence,
    getAuth,
    onAuthStateChanged,
    setPersistence,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


import {
    addDoc,
    collection,
    doc,
    getDoc,
    getFirestore,
    onSnapshot,
    query,
    runTransaction,
    serverTimestamp,
    updateDoc,
    where
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {

    apiKey:
        "AIzaSyBYiijyaBxtS_HkviqBzSEGTKI2m7vbtuI",

    authDomain:
        "crowdingfunding.firebaseapp.com",

    databaseURL:
        "https://crowdingfunding-default-rtdb.firebaseio.com",

    projectId:
        "crowdingfunding",

    storageBucket:
        "crowdingfunding.firebasestorage.app",

    messagingSenderId:
        "394070986612",

    appId:
        "1:394070986612:web:393006f052981bf9dba621",

    measurementId:
        "G-8LTEXQZMXS"

};


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app =
    initializeApp(firebaseConfig);


const auth =
    getAuth(app);


const db =
    getFirestore(app);


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;

let currentUserData = null;

let currentRole = null;

let campaigns = [];

let users = [];

let contributions = [];

let unsubscribeCampaigns = null;

let unsubscribeUsers = null;

let unsubscribeContributions = null;

let editingUserId = null;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loginPage =
    document.getElementById(
        "loginPage"
    );


const appPage =
    document.getElementById(
        "appPage"
    );


const loginForm =
    document.getElementById(
        "loginForm"
    );


const loginEmail =
    document.getElementById(
        "loginEmail"
    );


const loginPassword =
    document.getElementById(
        "loginPassword"
    );


const loginError =
    document.getElementById(
        "loginError"
    );


const loginButton =
    document.querySelector(
        ".login-button"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


const loggedInUser =
    document.getElementById(
        "loggedInUser"
    );


const brandTitle =
    document.getElementById(
        "brandTitle"
    );


const adminDashboard =
    document.getElementById(
        "adminDashboard"
    );


const creatorDashboard =
    document.getElementById(
        "creatorDashboard"
    );


const contributorDashboard =
    document.getElementById(
        "contributorDashboard"
    );


const campaignForm =
    document.getElementById(
        "campaignForm"
    );


const campaignMessage =
    document.getElementById(
        "campaignMessage"
    );


const createCampaignButton =
    document.getElementById(
        "createCampaignButton"
    );


const loadingOverlay =
    document.getElementById(
        "loadingOverlay"
    );


const loadingText =
    document.getElementById(
        "loadingText"
    );


const roleModal =
    document.getElementById(
        "roleModal"
    );


const editUserName =
    document.getElementById(
        "editUserName"
    );


const editUserRole =
    document.getElementById(
        "editUserRole"
    );


const closeRoleModal =
    document.getElementById(
        "closeRoleModal"
    );


const cancelRoleEdit =
    document.getElementById(
        "cancelRoleEdit"
    );


const saveRoleButton =
    document.getElementById(
        "saveRoleButton"
    );


/* =========================================================
   SESSION PERSISTENCE
   browserSessionPersistence means each browser tab
   maintains its own Firebase auth session.
========================================================= */

setPersistence(
    auth,
    browserSessionPersistence
).catch(
    (error) => {

        console.error(
            "Persistence error:",
            error
        );

    }
);


/* =========================================================
   LOADING SYSTEM
========================================================= */

function showLoading(
    message = "Loading..."
) {

    if (!loadingOverlay) {
        return;
    }

    loadingText.textContent =
        message;

    loadingOverlay.classList.remove(
        "hidden"
    );

}


function hideLoading() {

    if (!loadingOverlay) {
        return;
    }

    loadingOverlay.classList.add(
        "hidden"
    );

}


function setButtonLoading(
    button,
    loading,
    loadingLabel = "Loading..."
) {

    if (!button) {
        return;
    }


    if (loading) {

        button.dataset.originalText =
            button.innerHTML;

        button.disabled =
            true;

        button.innerHTML = `
            <span class="button-spinner"></span>
            ${loadingLabel}
        `;

    } else {

        button.disabled =
            false;

        button.innerHTML =
            button.dataset.originalText ||
            "Submit";

    }

}


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        loginError.textContent =
            "";


        const email =
            loginEmail.value.trim();


        const password =
            loginPassword.value;


        if (!email || !password) {

            loginError.textContent =
                "Please enter email and password.";

            return;
        }


        try {

            setButtonLoading(
                loginButton,
                true,
                "Signing in..."
            );


            showLoading(
                "Signing you in..."
            );


            await setPersistence(
                auth,
                browserSessionPersistence
            );


            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            let message =
                "Invalid email or password.";


            if (
                error.code ===
                "auth/user-not-found"
            ) {

                message =
                    "No account found with this email.";

            } else if (
                error.code ===
                "auth/wrong-password"
            ) {

                message =
                    "Incorrect password.";

            } else if (
                error.code ===
                "auth/invalid-credential"
            ) {

                message =
                    "Invalid email or password.";

            } else if (
                error.code ===
                "auth/too-many-requests"
            ) {

                message =
                    "Too many attempts. Please try again later.";

            } else if (
                error.code ===
                "auth/network-request-failed"
            ) {

                message =
                    "Network error. Please check your internet connection.";

            }


            loginError.textContent =
                message;


            hideLoading();


            setButtonLoading(
                loginButton,
                false
            );

        }

    }
);


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            currentUser = null;

            currentUserData = null;

            currentRole = null;

            cleanupListeners();

            showLoginPage();

            hideLoading();

            setButtonLoading(
                loginButton,
                false
            );

            return;
        }


        currentUser =
            user;


        try {

            showLoading(
                "Preparing your dashboard..."
            );


            await loadUserProfile(
                user.uid
            );


            showApplication();


            startRealtimeListeners();


            hideLoading();


            setButtonLoading(
                loginButton,
                false
            );


        } catch (error) {

            console.error(
                "User profile error:",
                error
            );


            hideLoading();


            loginError.textContent =
                "Unable to load your user profile.";


            await signOut(
                auth
            );

        }

    }
);


/* =========================================================
   LOAD USER PROFILE
========================================================= */

async function loadUserProfile(
    uid
) {

    const userRef =
        doc(
            db,
            "users",
            uid
        );


    const userSnapshot =
        await getDoc(
            userRef
        );


    if (!userSnapshot.exists()) {

        throw new Error(
            "User profile not found in Firestore."
        );

    }


    currentUserData =
        userSnapshot.data();


    currentRole =
        String(
            currentUserData.ROLE || ""
        ).toUpperCase();


    const allowedRoles = [
        "ADMIN",
        "CREATOR",
        "CONTRIBUTOR"
    ];


    if (
        !allowedRoles.includes(
            currentRole
        )
    ) {

        throw new Error(
            "Invalid user role."
        );

    }

}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLoginPage() {

    loginPage.classList.remove(
        "hidden"
    );


    appPage.classList.add(
        "hidden"
    );

}


/* =========================================================
   SHOW APPLICATION
========================================================= */

function showApplication() {

    loginPage.classList.add(
        "hidden"
    );


    appPage.classList.remove(
        "hidden"
    );


    const name =
        currentUserData.name ||
        currentUserData.email ||
        currentUser.email ||
        "User";


    loggedInUser.textContent =
        `Logged in as: ${getRoleLabel(currentRole)} (${name})`;


    brandTitle.textContent =
        `CrowdFund ${getRoleLabel(currentRole)}`;


    hideAllDashboards();


    if (
        currentRole ===
        "ADMIN"
    ) {

        adminDashboard.classList.remove(
            "hidden"
        );

    } else if (
        currentRole ===
        "CREATOR"
    ) {

        creatorDashboard.classList.remove(
            "hidden"
        );

    } else if (
        currentRole ===
        "CONTRIBUTOR"
    ) {

        contributorDashboard.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   ROLE LABEL
========================================================= */

function getRoleLabel(
    role
) {

    if (
        role ===
        "ADMIN"
    ) {

        return "Admin";

    }


    if (
        role ===
        "CREATOR"
    ) {

        return "Creator";

    }


    if (
        role ===
        "CONTRIBUTOR"
    ) {

        return "Contributor";

    }


    return role ||
        "Unknown";

}


/* =========================================================
   HIDE DASHBOARDS
========================================================= */

function hideAllDashboards() {

    adminDashboard.classList.add(
        "hidden"
    );


    creatorDashboard.classList.add(
        "hidden"
    );


    contributorDashboard.classList.add(
        "hidden"
    );

}


/* =========================================================
   LOGOUT
========================================================= */

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            setButtonLoading(
                logoutButton,
                true,
                "Logging out..."
            );


            showLoading(
                "Signing you out..."
            );


            await signOut(
                auth
            );


        } catch (error) {

            console.error(
                "Logout error:",
                error
            );


            hideLoading();


            setButtonLoading(
                logoutButton,
                false
            );

        }

    }
);


/* =========================================================
   REALTIME LISTENERS
========================================================= */

function startRealtimeListeners() {

    cleanupListeners();


    /* =====================================================
       CAMPAIGNS
    ====================================================== */

    unsubscribeCampaigns =
        onSnapshot(
            collection(
                db,
                "campaigns"
            ),

            (snapshot) => {

                campaigns =
                    snapshot.docs.map(
                        (item) => ({

                            id:
                                item.id,

                            ...item.data()

                        })
                    );


                renderCampaigns();

            },

            (error) => {

                console.error(
                    "Campaign listener error:",
                    error
                );

            }
        );


    /* =====================================================
       ADMIN USERS
    ====================================================== */

    if (
        currentRole ===
        "ADMIN"
    ) {

        unsubscribeUsers =
            onSnapshot(
                collection(
                    db,
                    "users"
                ),

                (snapshot) => {

                    users =
                        snapshot.docs.map(
                            (item) => ({

                                id:
                                    item.id,

                                ...item.data()

                            })
                        );


                    renderUsers();

                },

                (error) => {

                    console.error(
                        "User listener error:",
                        error
                    );

                }
            );

    }


    /* =====================================================
       CONTRIBUTION HISTORY
    ====================================================== */

    if (
        currentRole ===
        "CONTRIBUTOR"
    ) {

        const contributionQuery =
            query(
                collection(
                    db,
                    "donations"
                ),

                where(
                    "contributorId",
                    "==",
                    currentUser.uid
                )
            );


        unsubscribeContributions =
            onSnapshot(
                contributionQuery,

                (snapshot) => {

                    contributions =
                        snapshot.docs.map(
                            (item) => ({

                                id:
                                    item.id,

                                ...item.data()

                            })
                        );


                    contributions.sort(
                        (a, b) => {

                            const dateA =
                                getTimestampMillis(
                                    a.createdAt
                                );

                            const dateB =
                                getTimestampMillis(
                                    b.createdAt
                                );

                            return dateB -
                                dateA;

                        }
                    );


                    renderContributionHistory();

                },

                (error) => {

                    console.error(
                        "Contribution listener error:",
                        error
                    );

                }
            );

    }

}


/* =========================================================
   CLEANUP LISTENERS
========================================================= */

function cleanupListeners() {

    if (
        unsubscribeCampaigns
    ) {

        unsubscribeCampaigns();

        unsubscribeCampaigns =
            null;

    }


    if (
        unsubscribeUsers
    ) {

        unsubscribeUsers();

        unsubscribeUsers =
            null;

    }


    if (
        unsubscribeContributions
    ) {

        unsubscribeContributions();

        unsubscribeContributions =
            null;

    }

}


/* =========================================================
   RENDER ALL CAMPAIGN VIEWS
========================================================= */

function renderCampaigns() {

    renderContributorCampaigns();

    renderCreatorCampaigns();

    renderAdminCampaigns();

    renderContributionHistory();

}


/* =========================================================
   CONTRIBUTOR CAMPAIGNS
========================================================= */

function renderContributorCampaigns() {

    const container =
        document.getElementById(
            "contributorCampaigns"
        );


    if (!container) {
        return;
    }


    if (
        currentRole !==
        "CONTRIBUTOR"
    ) {

        return;

    }


    const approvedCampaigns =
        campaigns.filter(
            (campaign) => {

                const status =
                    String(
                        campaign.status ||
                        ""
                    ).toUpperCase();

                return (
                    status ===
                    "APPROVED"
                );

            }
        );


    if (
        approvedCampaigns.length ===
        0
    ) {

        container.innerHTML = `
            <div class="empty-message">
                No approved campaigns are available right now.
            </div>
        `;

        return;
    }


    container.innerHTML =
        approvedCampaigns
            .map(
                (campaign) =>
                    renderCampaignCard(
                        campaign
                    )
            )
            .join("");

}


/* =========================================================
   CAMPAIGN CARD
========================================================= */

function renderCampaignCard(
    campaign
) {

    const target =
        Number(
            campaign.targetAmount
        ) || 0;


    const collected =
        Number(
            campaign.collectedAmount
        ) || 0;


    const percentage =
        target > 0
            ? Math.min(
                100,
                Math.round(
                    (collected /
                        target) *
                    100
                )
            )
            : 0;


    const completed =
        collected >= target;


    return `
        <div class="campaign-card">

            <div class="campaign-title">
                ${escapeHTML(
                    campaign.title ||
                    "Untitled Campaign"
                )}
            </div>


            <div class="campaign-description">
                ${escapeHTML(
                    campaign.description ||
                    "No description available."
                )}
            </div>


            <div class="amount-row">

                <span>
                    ${formatCurrency(
                        collected
                    )}
                    raised (${percentage}%)
                </span>


                <span>
                    Goal:
                    ${formatCurrency(
                        target
                    )}
                </span>

            </div>


            <div class="progress-container">

                <div class="progress-background">

                    <div
                        class="progress-bar"
                        style="width: ${percentage}%"
                    ></div>

                </div>

            </div>


            <button
                class="support-button"
                onclick="supportCampaign('${campaign.id}')"
                ${completed ? "disabled" : ""}
            >

                ${
                    completed
                        ? "Campaign Completed"
                        : "Support Campaign"
                }

            </button>

        </div>
    `;

}


/* =========================================================
   SUPPORT CAMPAIGN
========================================================= */

window.supportCampaign =
    async function (
        campaignId
    ) {

        if (
            currentRole !==
            "CONTRIBUTOR"
        ) {

            return;

        }


        const campaign =
            campaigns.find(
                (item) =>
                    item.id ===
                    campaignId
            );


        if (!campaign) {

            alert(
                "Campaign not found."
            );

            return;

        }


        const target =
            Number(
                campaign.targetAmount
            ) || 0;


        const collected =
            Number(
                campaign.collectedAmount
            ) || 0;


        if (
            collected >=
            target
        ) {

            alert(
                "This campaign has already reached its goal."
            );

            return;

        }


        const remaining =
            target -
            collected;


        const input =
            prompt(
                `Enter contribution amount.\n\nRemaining amount: ${formatCurrency(remaining)}`
            );


        if (
            input ===
            null
        ) {

            return;

        }


        const amount =
            Number(
                input
            );


        if (
            !Number.isFinite(
                amount
            ) ||
            amount <= 0
        ) {

            alert(
                "Please enter a valid positive amount."
            );

            return;

        }


        if (
            amount >
            remaining
        ) {

            alert(
                `Maximum contribution for this campaign is ${formatCurrency(remaining)}.`
            );

            return;

        }


        const confirmed =
            confirm(
                `Contribute ${formatCurrency(amount)} to "${campaign.title}"?`
            );


        if (!confirmed) {

            return;

        }


        try {

            showLoading(
                "Processing your contribution..."
            );


            const campaignRef =
                doc(
                    db,
                    "campaigns",
                    campaignId
                );


            await runTransaction(
                db,
                async (transaction) => {

                    const campaignSnapshot =
                        await transaction.get(
                            campaignRef
                        );


                    if (
                        !campaignSnapshot.exists()
                    ) {

                        throw new Error(
                            "Campaign no longer exists."
                        );

                    }


                    const latest =
                        campaignSnapshot.data();


                    const latestTarget =
                        Number(
                            latest.targetAmount
                        ) || 0;


                    const latestCollected =
                        Number(
                            latest.collectedAmount
                        ) || 0;


                    if (
                        latestCollected >=
                        latestTarget
                    ) {

                        throw new Error(
                            "Campaign has already reached its goal."
                        );

                    }


                    const latestRemaining =
                        latestTarget -
                        latestCollected;


                    if (
                        amount >
                        latestRemaining
                    ) {

                        throw new Error(
                            "Contribution exceeds the remaining campaign amount."
                        );

                    }


                    const newCollected =
                        latestCollected +
                        amount;


                    const newStatus =
                        newCollected >=
                        latestTarget
                            ? "COMPLETED"
                            : "APPROVED";


                    transaction.update(
                        campaignRef,
                        {

                            collectedAmount:
                                newCollected,

                            status:
                                newStatus,

                            updatedAt:
                                serverTimestamp()

                        }
                    );

                }
            );


            await addDoc(
                collection(
                    db,
                    "donations"
                ),
                {

                    contributorId:
                        currentUser.uid,

                    contributorEmail:
                        currentUser.email,

                    contributorName:
                        currentUserData.name ||
                        currentUser.email,

                    campaignId:
                        campaignId,

                    campaignTitle:
                        campaign.title,

                    amount:
                        amount,

                    createdAt:
                        serverTimestamp()

                }
            );


            hideLoading();


            alert(
                "Contribution successful!"
            );


        } catch (error) {

            console.error(
                "Contribution error:",
                error
            );


            hideLoading();


            alert(
                error.message ||
                "Unable to process contribution."
            );

        }

    };


/* =========================================================
   CONTRIBUTION HISTORY
========================================================= */

function renderContributionHistory() {

    const container =
        document.getElementById(
            "contributionHistory"
        );


    if (!container) {
        return;
    }


    if (
        currentRole !==
        "CONTRIBUTOR"
    ) {

        return;

    }


    if (
        contributions.length ===
        0
    ) {

        container.innerHTML = `
            <div class="empty-message">
                You haven't made any contributions yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        contributions
            .map(
                (item) => {

                    const date =
                        formatTimestamp(
                            item.createdAt
                        );


                    const campaignTitle =
                        getDonationCampaignTitle(
                            item
                        );


                    return `
                        <div class="history-item">

                            <div>

                                <div class="history-title">

                                    ${escapeHTML(
                                        campaignTitle
                                    )}

                                </div>


                                <div class="history-date">

                                    ${date}

                                </div>

                            </div>


                            <div class="history-amount">

                                + ${formatCurrency(
                                    Number(
                                        item.amount
                                    ) || 0
                                )}

                            </div>

                        </div>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   GET ACTUAL CAMPAIGN NAME FOR DONATION
========================================================= */

function getDonationCampaignTitle(
    item
) {

    if (
        item.campaignTitle &&
        item.campaignTitle !==
            "Campaign"
    ) {

        return item.campaignTitle;

    }


    const campaign =
        campaigns.find(
            (campaign) =>
                campaign.id ===
                item.campaignId
        );


    return (
        campaign?.title ||
        item.campaignTitle ||
        "Campaign"
    );

}


/* =========================================================
   CREATOR CAMPAIGNS
========================================================= */

function renderCreatorCampaigns() {

    const container =
        document.getElementById(
            "creatorCampaigns"
        );


    if (!container) {
        return;
    }


    if (
        currentRole !==
        "CREATOR"
    ) {

        return;

    }


    const ownCampaigns =
        campaigns.filter(
            (campaign) =>
                campaign.creatorId ===
                currentUser.uid
        );


    if (
        ownCampaigns.length ===
        0
    ) {

        container.innerHTML = `
            <div class="empty-message">
                You haven't created any campaigns yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        ownCampaigns
            .map(
                (campaign) =>
                    renderCreatorCampaign(
                        campaign
                    )
            )
            .join("");

}


/* =========================================================
   CREATOR CAMPAIGN CARD
========================================================= */

function renderCreatorCampaign(
    campaign
) {

    const target =
        Number(
            campaign.targetAmount
        ) || 0;


    const collected =
        Number(
            campaign.collectedAmount
        ) || 0;


    const percentage =
        target > 0
            ? Math.min(
                100,
                Math.round(
                    (collected /
                        target) *
                    100
                )
            )
            : 0;


    const status =
        String(
            campaign.status ||
            "PENDING"
        ).toUpperCase();


    let statusMessage =
        "";


    if (
        status ===
        "PENDING"
    ) {

        statusMessage = `
            <div class="status-note">
                Your campaign is waiting for admin approval.
            </div>
        `;

    } else if (
        status ===
        "REJECTED"
    ) {

        statusMessage = `
            <div class="status-note rejected-note">
                ${
                    escapeHTML(
                        campaign.rejectionReason ||
                        "Campaign was rejected by the admin."
                    )
                }
            </div>
        `;

    } else if (
        status ===
        "APPROVED"
    ) {

        statusMessage = `
            <div class="status-note approved-note">
                Your campaign is live and accepting contributions.
            </div>
        `;

    } else if (
        status ===
        "COMPLETED"
    ) {

        statusMessage = `
            <div class="status-note approved-note">
                Campaign has reached its target.
            </div>
        `;

    }


    return `
        <div class="creator-campaign">

            <div class="creator-campaign-header">

                <div class="creator-campaign-title">

                    ${escapeHTML(
                        campaign.title ||
                        "Untitled Campaign"
                    )}

                </div>


                <span
                    class="status-badge ${getStatusClass(status)}"
                >

                    ${escapeHTML(
                        status
                    )}

                </span>

            </div>


            <div class="creator-campaign-description">

                ${escapeHTML(
                    campaign.description ||
                    "No description."
                )}

            </div>


            <div class="amount-row">

                <span>
                    ${formatCurrency(
                        collected
                    )}
                    raised (${percentage}%)
                </span>


                <span>
                    Goal:
                    ${formatCurrency(
                        target
                    )}
                </span>

            </div>


            <div class="progress-container">

                <div class="progress-background">

                    <div
                        class="progress-bar"
                        style="width: ${percentage}%"
                    ></div>

                </div>

            </div>


            ${statusMessage}

        </div>
    `;

}


/* =========================================================
   CREATE CAMPAIGN
========================================================= */

campaignForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (
            currentRole !==
            "CREATOR"
        ) {

            return;

        }


        const title =
            document
                .getElementById(
                    "campaignTitle"
                )
                .value
                .trim();


        const description =
            document
                .getElementById(
                    "campaignDescription"
                )
                .value
                .trim();


        const target =
            Number(
                document
                    .getElementById(
                        "campaignTarget"
                    )
                    .value
            );


        campaignMessage.className =
            "form-message";


        campaignMessage.textContent =
            "";


        if (!title) {

            showCampaignMessage(
                "Campaign name is required.",
                true
            );

            return;

        }


        if (!description) {

            showCampaignMessage(
                "Campaign description is required.",
                true
            );

            return;

        }


        if (
            !Number.isFinite(
                target
            ) ||
            target <= 0
        ) {

            showCampaignMessage(
                "Please enter a valid target amount.",
                true
            );

            return;

        }


        try {

            setButtonLoading(
                createCampaignButton,
                true,
                "Creating..."
            );


            showLoading(
                "Creating your campaign..."
            );


            const creatorName =
                currentUserData.name ||
                currentUserData.email ||
                currentUser.email ||
                "Creator";


            await addDoc(
                collection(
                    db,
                    "campaigns"
                ),
                {

                    title:
                        title,

                    description:
                        description,

                    targetAmount:
                        target,

                    collectedAmount:
                        0,

                    creatorId:
                        currentUser.uid,

                    creatorName:
                        creatorName,

                    status:
                        "PENDING",

                    rejectionReason:
                        "",

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                }
            );


            campaignForm.reset();


            showCampaignMessage(
                "Campaign created successfully. It is now waiting for admin approval.",
                false
            );


            hideLoading();


        } catch (error) {

            console.error(
                "Create campaign error:",
                error
            );


            hideLoading();


            showCampaignMessage(
                error.message ||
                "Unable to create campaign.",
                true
            );

        } finally {

            setButtonLoading(
                createCampaignButton,
                false
            );

        }

    }
);


/* =========================================================
   ADMIN CAMPAIGNS
========================================================= */

function renderAdminCampaigns() {

    const container =
        document.getElementById(
            "adminCampaigns"
        );


    if (!container) {
        return;
    }


    if (
        currentRole !==
        "ADMIN"
    ) {

        return;

    }


    if (
        campaigns.length ===
        0
    ) {

        container.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="table-loading"
                >
                    No campaigns found.
                </td>
            </tr>
        `;

        return;

    }


    const sortedCampaigns =
        [...campaigns].sort(
            (a, b) => {

                const aTime =
                    getTimestampMillis(
                        a.createdAt
                    );

                const bTime =
                    getTimestampMillis(
                        b.createdAt
                    );

                return bTime -
                    aTime;

            }
        );


    container.innerHTML =
        sortedCampaigns
            .map(
                (campaign) =>
                    renderAdminCampaignRow(
                        campaign
                    )
            )
            .join("");

}


/* =========================================================
   ADMIN CAMPAIGN ROW
========================================================= */

function renderAdminCampaignRow(
    campaign
) {

    const status =
        String(
            campaign.status ||
            "PENDING"
        ).toUpperCase();


    let actions =
        `<span class="muted-action">No action required</span>`;


    if (
        status ===
        "PENDING"
    ) {

        actions = `
            <div class="admin-action-group">

                <button
                    class="approve-button"
                    onclick="approveCampaign('${campaign.id}')"
                >
                    Approve
                </button>


                <button
                    class="reject-button"
                    onclick="rejectCampaign('${campaign.id}')"
                >
                    Reject
                </button>

            </div>
        `;

    }


    return `
        <tr>

            <td>

                ${escapeHTML(
                    campaign.title ||
                    "Untitled Campaign"
                )}

            </td>


            <td>

                ${formatCurrency(
                    Number(
                        campaign.targetAmount
                    ) || 0
                )}

            </td>


            <td>

                <span
                    class="status-badge ${getStatusClass(status)}"
                >

                    ${escapeHTML(
                        status
                    )}

                </span>

            </td>


            <td>

                ${actions}

            </td>

        </tr>
    `;

}


/* =========================================================
   ADMIN APPROVE
========================================================= */

window.approveCampaign =
    async function (
        campaignId
    ) {

        if (
            currentRole !==
            "ADMIN"
        ) {

            return;

        }


        const campaign =
            campaigns.find(
                (item) =>
                    item.id ===
                    campaignId
            );


        if (!campaign) {

            alert(
                "Campaign not found."
            );

            return;

        }


        if (
            String(
                campaign.status ||
                ""
            ).toUpperCase() !==
            "PENDING"
        ) {

            alert(
                "Only pending campaigns can be approved."
            );

            return;

        }


        const confirmed =
            confirm(
                `Approve "${campaign.title}"?`
            );


        if (!confirmed) {

            return;

        }


        try {

            showLoading(
                "Approving campaign..."
            );


            await updateDoc(
                doc(
                    db,
                    "campaigns",
                    campaignId
                ),
                {

                    status:
                        "APPROVED",

                    rejectionReason:
                        "",

                    approvedBy:
                        currentUser.uid,

                    approvedAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                }
            );


            hideLoading();


            alert(
                "Campaign approved successfully."
            );


        } catch (error) {

            console.error(
                "Approve error:",
                error
            );


            hideLoading();


            alert(
                error.message ||
                "Unable to approve campaign."
            );

        }

    };


/* =========================================================
   ADMIN REJECT
========================================================= */

window.rejectCampaign =
    async function (
        campaignId
    ) {

        if (
            currentRole !==
            "ADMIN"
        ) {

            return;

        }


        const campaign =
            campaigns.find(
                (item) =>
                    item.id ===
                    campaignId
            );


        if (!campaign) {

            alert(
                "Campaign not found."
            );

            return;

        }


        if (
            String(
                campaign.status ||
                ""
            ).toUpperCase() !==
            "PENDING"
        ) {

            alert(
                "Only pending campaigns can be rejected."
            );

            return;

        }


        const reason =
            prompt(
                "Enter rejection reason:"
            );


        if (
            reason ===
            null
        ) {

            return;

        }


        const cleanReason =
            reason.trim();


        if (!cleanReason) {

            alert(
                "Please enter a rejection reason."
            );

            return;

        }


        try {

            showLoading(
                "Rejecting campaign..."
            );


            await updateDoc(
                doc(
                    db,
                    "campaigns",
                    campaignId
                ),
                {

                    status:
                        "REJECTED",

                    rejectionReason:
                        cleanReason,

                    rejectedBy:
                        currentUser.uid,

                    rejectedAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                }
            );


            hideLoading();


            alert(
                "Campaign rejected successfully."
            );


        } catch (error) {

            console.error(
                "Reject error:",
                error
            );


            hideLoading();


            alert(
                error.message ||
                "Unable to reject campaign."
            );

        }

    };


/* =========================================================
   ADMIN USERS
========================================================= */

function renderUsers() {

    const container =
        document.getElementById(
            "usersTableBody"
        );


    if (!container) {
        return;
    }


    if (
        currentRole !==
        "ADMIN"
    ) {

        return;

    }


    if (
        users.length ===
        0
    ) {

        container.innerHTML = `
            <tr>

                <td
                    colspan="4"
                    class="table-loading"
                >
                    No users found.
                </td>

            </tr>
        `;

        return;

    }


    const sortedUsers =
        [...users].sort(
            (a, b) => {

                const nameA =
                    String(
                        a.name ||
                        a.email ||
                        ""
                    ).toLowerCase();


                const nameB =
                    String(
                        b.name ||
                        b.email ||
                        ""
                    ).toLowerCase();


                return nameA.localeCompare(
                    nameB
                );

            }
        );


    container.innerHTML =
        sortedUsers
            .map(
                (user) => {

                    const role =
                        String(
                            user.ROLE ||
                            "UNKNOWN"
                        ).toUpperCase();


                    const isCurrentUser =
                        user.id ===
                        currentUser.uid;


                    return `
                        <tr>

                            <td>

                                ${escapeHTML(
                                    user.name ||
                                    "Unnamed User"
                                )}

                            </td>


                            <td>

                                ${escapeHTML(
                                    user.email ||
                                    "No email"
                                )}

                            </td>


                            <td>

                                <span
                                    class="status-badge ${getRoleBadgeClass(role)}"
                                >

                                    ${escapeHTML(
                                        getRoleLabel(
                                            role
                                        )
                                    )}

                                </span>

                            </td>


                            <td>

                                <button
                                    class="edit-user-button"
                                    onclick="openRoleEditor('${user.id}')"
                                >
                                    Edit Role
                                </button>

                                ${
                                    isCurrentUser
                                        ? `
                                            <span
                                                class="current-user-label"
                                            >
                                                You
                                            </span>
                                        `
                                        : ""
                                }

                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   OPEN ROLE EDITOR
========================================================= */

window.openRoleEditor =
    function (
        userId
    ) {

        if (
            currentRole !==
            "ADMIN"
        ) {

            return;

        }


        const user =
            users.find(
                (item) =>
                    item.id ===
                    userId
            );


        if (!user) {

            alert(
                "User not found."
            );

            return;

        }


        editingUserId =
            userId;


        editUserName.textContent =
            `Change role for ${
                user.name ||
                user.email ||
                "this user"
            }`;


        editUserRole.value =
            String(
                user.ROLE ||
                "CONTRIBUTOR"
            ).toUpperCase();


        roleModal.classList.remove(
            "hidden"
        );

    };


/* =========================================================
   CLOSE ROLE EDITOR
========================================================= */

function closeRoleEditor() {

    editingUserId =
        null;


    roleModal.classList.add(
        "hidden"
    );

}


closeRoleModal.addEventListener(
    "click",
    closeRoleEditor
);


cancelRoleEdit.addEventListener(
    "click",
    closeRoleEditor
);


roleModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            roleModal
        ) {

            closeRoleEditor();

        }

    }
);


/* =========================================================
   SAVE ROLE
========================================================= */

saveRoleButton.addEventListener(
    "click",
    async () => {

        if (
            currentRole !==
            "ADMIN"
        ) {

            return;

        }


        if (!editingUserId) {

            return;

        }


        const newRole =
            editUserRole.value;


        const selectedUser =
            users.find(
                (item) =>
                    item.id ===
                    editingUserId
            );


        if (!selectedUser) {

            return;

        }


        const oldRole =
            String(
                selectedUser.ROLE ||
                ""
            ).toUpperCase();


        if (
            oldRole ===
            newRole
        ) {

            closeRoleEditor();

            return;

        }


        try {

            setButtonLoading(
                saveRoleButton,
                true,
                "Saving..."
            );


            showLoading(
                "Updating user role..."
            );


            await updateDoc(
                doc(
                    db,
                    "users",
                    editingUserId
                ),
                {

                    ROLE:
                        newRole,

                    updatedAt:
                        serverTimestamp()

                }
            );


            closeRoleEditor();


            hideLoading();


            alert(
                `User role changed to ${getRoleLabel(newRole)} successfully.`
            );


        } catch (error) {

            console.error(
                "Role update error:",
                error
            );


            hideLoading();


            alert(
                error.message ||
                "Unable to update user role."
            );

        } finally {

            setButtonLoading(
                saveRoleButton,
                false
            );

        }

    }
);


/* =========================================================
   SIDEBAR NAVIGATION
========================================================= */

document
    .querySelectorAll(
        ".sidebar"
    )
    .forEach(
        (sidebar) => {

            const buttons =
                sidebar.querySelectorAll(
                    ".sidebar-item"
                );


            buttons.forEach(
                (button) => {

                    button.addEventListener(
                        "click",
                        () => {

                            const sectionId =
                                button.dataset.section;


                            const dashboard =
                                sidebar.closest(
                                    ".role-dashboard"
                                );


                            showLoading(
                                "Loading section..."
                            );


                            setTimeout(
                                () => {

                                    switchDashboardSection(
                                        dashboard,
                                        sectionId
                                    );


                                    hideLoading();

                                },
                                250
                            );

                        }
                    );

                }
            );

        }
    );


/* =========================================================
   SWITCH DASHBOARD SECTION
========================================================= */

function switchDashboardSection(
    dashboard,
    sectionId
) {

    if (!dashboard) {
        return;
    }


    const sections =
        dashboard.querySelectorAll(
            ".dashboard-section"
        );


    sections.forEach(
        (section) => {

            section.classList.add(
                "hidden"
            );

        }
    );


    const targetSection =
        dashboard.querySelector(
            `#${sectionId}`
        );


    if (targetSection) {

        targetSection.classList.remove(
            "hidden"
        );

    }


    const buttons =
        dashboard.querySelectorAll(
            ".sidebar-item"
        );


    buttons.forEach(
        (button) => {

            button.classList.remove(
                "active"
            );


            if (
                button.dataset.section ===
                sectionId
            ) {

                button.classList.add(
                    "active"
                );

            }

        }
    );

}


/* =========================================================
   CAMPAIGN MESSAGE
========================================================= */

function showCampaignMessage(
    message,
    isError = false
) {

    campaignMessage.textContent =
        message;


    campaignMessage.className =
        isError
            ? "form-message error-form-message"
            : "form-message success-message";

}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(
    status
) {

    switch (
        String(
            status || ""
        ).toUpperCase()
    ) {

        case "APPROVED":

            return "status-approved";


        case "PENDING":

            return "status-pending";


        case "REJECTED":

            return "status-rejected";


        case "COMPLETED":

            return "status-completed";


        default:

            return "status-pending";

    }

}


/* =========================================================
   ROLE BADGE CLASS
========================================================= */

function getRoleBadgeClass(
    role
) {

    switch (
        String(
            role || ""
        ).toUpperCase()
    ) {

        case "ADMIN":

            return "status-approved";


        case "CREATOR":

            return "status-pending";


        case "CONTRIBUTOR":

            return "status-approved";


        default:

            return "status-rejected";

    }

}


/* =========================================================
   FORMAT CURRENCY
========================================================= */

function formatCurrency(
    amount
) {

    return new Intl.NumberFormat(
        "en-US",
        {
            style:
                "currency",

            currency:
                "USD",

            minimumFractionDigits:
                2
        }
    ).format(
        Number(amount) || 0
    );

}


/* =========================================================
   TIMESTAMP MILLISECONDS
========================================================= */

function getTimestampMillis(
    timestamp
) {

    if (!timestamp) {

        return 0;

    }


    if (
        typeof timestamp.toMillis ===
        "function"
    ) {

        return timestamp.toMillis();

    }


    if (
        timestamp.seconds !==
        undefined
    ) {

        return (
            timestamp.seconds *
            1000
        );

    }


    if (
        timestamp instanceof Date
    ) {

        return timestamp.getTime();

    }


    return 0;

}


/* =========================================================
   FORMAT TIMESTAMP
========================================================= */

function formatTimestamp(
    timestamp
) {

    const millis =
        getTimestampMillis(
            timestamp
        );


    if (!millis) {

        return "Just now";

    }


    const date =
        new Date(
            millis
        );


    return date.toLocaleString(
        "en-IN",
        {
            day:
                "numeric",

            month:
                "short",

            year:
                "numeric",

            hour:
                "numeric",

            minute:
                "2-digit"
        }
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ??
        "";


    return div.innerHTML;

}