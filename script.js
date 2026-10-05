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

    apiKey: "AIzaSyBYiijyaBxtS_HkviqBzSEGTKI2m7vbtuI",

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

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


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


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loginPage =
    document.getElementById("loginPage");

const appPage =
    document.getElementById("appPage");

const loginForm =
    document.getElementById("loginForm");

const loginEmail =
    document.getElementById("loginEmail");

const loginPassword =
    document.getElementById("loginPassword");

const loginError =
    document.getElementById("loginError");

const logoutButton =
    document.getElementById("logoutButton");

const loggedInUser =
    document.getElementById("loggedInUser");

const brandTitle =
    document.getElementById("brandTitle");

const adminDashboard =
    document.getElementById("adminDashboard");

const creatorDashboard =
    document.getElementById("creatorDashboard");

const contributorDashboard =
    document.getElementById("contributorDashboard");

const campaignForm =
    document.getElementById("campaignForm");

const campaignMessage =
    document.getElementById("campaignMessage");


/* =========================================================
   SESSION PERSISTENCE
========================================================= */

setPersistence(
    auth,
    browserSessionPersistence
).catch((error) => {

    console.error(
        "Persistence error:",
        error
    );

});


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        loginError.textContent = "";

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

            }

            loginError.textContent =
                message;

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

            showLoginPage();

            cleanupListeners();

            return;
        }


        currentUser = user;


        try {

            await loadUserProfile(user.uid);

            showApplication();

            startRealtimeListeners();

        } catch (error) {

            console.error(
                "User profile error:",
                error
            );

            loginError.textContent =
                "Unable to load your user profile.";

            await signOut(auth);

        }

    }
);


/* =========================================================
   LOAD USER PROFILE
========================================================= */

async function loadUserProfile(uid) {

    const userRef =
        doc(db, "users", uid);

    const userSnapshot =
        await getDoc(userRef);


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


    if (!allowedRoles.includes(currentRole)) {

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


    if (currentRole === "ADMIN") {

        adminDashboard.classList.remove(
            "hidden"
        );

    } else if (currentRole === "CREATOR") {

        creatorDashboard.classList.remove(
            "hidden"
        );

    } else if (currentRole === "CONTRIBUTOR") {

        contributorDashboard.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   ROLE LABEL
========================================================= */

function getRoleLabel(role) {

    if (role === "ADMIN") {
        return "Admin";
    }

    if (role === "CREATOR") {
        return "Creator";
    }

    if (role === "CONTRIBUTOR") {
        return "Contributor";
    }

    return role;

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

            await signOut(auth);

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);


/* =========================================================
   REALTIME LISTENERS
========================================================= */

function startRealtimeListeners() {

    cleanupListeners();


    /* -----------------------------------------
       CAMPAIGNS
    ----------------------------------------- */

    unsubscribeCampaigns =
        onSnapshot(
            collection(db, "campaigns"),
            (snapshot) => {

                campaigns =
                    snapshot.docs.map(
                        (item) => ({

                            id: item.id,

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


    /* -----------------------------------------
       ADMIN USERS
    ----------------------------------------- */

    if (currentRole === "ADMIN") {

        unsubscribeUsers =
            onSnapshot(
                collection(db, "users"),
                (snapshot) => {

                    users =
                        snapshot.docs.map(
                            (item) => ({

                                id: item.id,

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


    /* -----------------------------------------
       CONTRIBUTION HISTORY
    ----------------------------------------- */

    if (currentRole === "CONTRIBUTOR") {

        const contributionQuery =
            query(
                collection(db, "donations"),
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

                                id: item.id,

                                ...item.data()

                            })
                        );


                    contributions.sort(
                        (a, b) => {

                            const aTime =
                                a.createdAt?.seconds ||
                                0;

                            const bTime =
                                b.createdAt?.seconds ||
                                0;

                            return bTime - aTime;

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

    if (unsubscribeCampaigns) {

        unsubscribeCampaigns();

        unsubscribeCampaigns = null;

    }


    if (unsubscribeUsers) {

        unsubscribeUsers();

        unsubscribeUsers = null;

    }


    if (unsubscribeContributions) {

        unsubscribeContributions();

        unsubscribeContributions = null;

    }

}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderCampaigns() {

    renderContributorCampaigns();

    renderCreatorCampaigns();

    renderAdminCampaigns();

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


    const approvedCampaigns =
        campaigns.filter(
            (campaign) =>
                String(campaign.status || "")
                    .toUpperCase() === "APPROVED"
        );


    if (approvedCampaigns.length === 0) {

        container.innerHTML = `
            <div class="empty-message">
                No approved campaigns available right now.
            </div>
        `;

        return;
    }


    container.innerHTML =
        approvedCampaigns
            .map(
                (campaign) =>
                    createContributorCampaignHTML(
                        campaign
                    )
            )
            .join("");

}


/* =========================================================
   CONTRIBUTOR CAMPAIGN CARD
========================================================= */

function createContributorCampaignHTML(
    campaign
) {

    const target =
        Number(campaign.targetAmount) || 0;

    const collected =
        Number(campaign.collectedAmount) || 0;


    const percentage =
        target > 0
            ? Math.min(
                100,
                Math.round(
                    (collected / target) * 100
                )
            )
            : 0;


    const completed =
        percentage >= 100 ||
        String(campaign.status || "")
            .toUpperCase() === "COMPLETED";


    return `
        <div class="campaign-card">

            <h2>
                ${escapeHTML(
                    campaign.title ||
                    "Untitled Campaign"
                )}
            </h2>

            <p class="campaign-description">
                ${escapeHTML(
                    campaign.description ||
                    "No description available."
                )}
            </p>

            <div class="amount-row">

                <span>
                    ${formatCurrency(collected)}
                    raised (${percentage}%)
                </span>

                <span>
                    Goal: ${formatCurrency(target)}
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
    async function (campaignId) {

        const campaign =
            campaigns.find(
                (item) =>
                    item.id === campaignId
            );


        if (!campaign) {

            alert(
                "Campaign not found."
            );

            return;

        }


        const target =
            Number(campaign.targetAmount) || 0;

        const collected =
            Number(campaign.collectedAmount) || 0;


        if (collected >= target) {

            alert(
                "This campaign has already reached its goal."
            );

            return;

        }


        const remaining =
            target - collected;


        const input =
            prompt(
                `Enter contribution amount.\n\nRemaining amount: ${formatCurrency(remaining)}`
            );


        if (input === null) {
            return;
        }


        const amount =
            Number(input);


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            alert(
                "Please enter a valid positive amount."
            );

            return;

        }


        if (amount > remaining) {

            alert(
                `Maximum contribution for this campaign is ${formatCurrency(remaining)}.`
            );

            return;

        }


        try {

            await contributeToCampaign(
                campaignId,
                amount
            );

            alert(
                "Contribution successful!"
            );

        } catch (error) {

            console.error(
                "Contribution error:",
                error
            );

            alert(
                error.message ||
                "Unable to complete contribution."
            );

        }

    };


/* =========================================================
   CONTRIBUTE TRANSACTION
========================================================= */

async function contributeToCampaign(
    campaignId,
    amount
) {

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
                    "Campaign does not exist."
                );

            }


            const campaign =
                campaignSnapshot.data();


            const status =
                String(
                    campaign.status || ""
                ).toUpperCase();


            if (status !== "APPROVED") {

                throw new Error(
                    "This campaign is not currently available for contributions."
                );

            }


            const currentCollected =
                Number(
                    campaign.collectedAmount
                ) || 0;


            const target =
                Number(
                    campaign.targetAmount
                ) || 0;


            const newCollected =
                currentCollected + amount;


            if (newCollected > target) {

                throw new Error(
                    "Contribution exceeds the campaign target."
                );

            }


            const newStatus =
                newCollected >= target
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


    /* -----------------------------------------
       SAVE DONATION HISTORY
    ----------------------------------------- */

    const contributorName =
        currentUserData.name ||
        currentUserData.email ||
        currentUser.email ||
        "Contributor";


    await addDoc(
        collection(db, "donations"),
        {

            campaignId:

                campaignId,

            campaignTitle:

                campaigns.find(
                    (item) =>
                        item.id === campaignId
                )?.title ||
                "Campaign",

            contributorId:

                currentUser.uid,

            contributorName:

                contributorName,

            amount:

                amount,

            createdAt:

                serverTimestamp()

        }
    );

}


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


    if (contributions.length === 0) {

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


                    return `
                        <div class="history-item">

                            <div>

                                <div class="history-title">
                                    ${escapeHTML(
                                        item.campaignTitle ||
                                        "Campaign"
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


    const ownCampaigns =
        campaigns.filter(
            (campaign) =>
                campaign.creatorId ===
                currentUser.uid
        );


    if (ownCampaigns.length === 0) {

        container.innerHTML = `
            <div class="empty-message">
                You haven't created any campaigns yet.
            </div>
        `;

        return;

    }


    ownCampaigns.sort(
        (a, b) => {

            const aTime =
                a.createdAt?.seconds || 0;

            const bTime =
                b.createdAt?.seconds || 0;

            return bTime - aTime;

        }
    );


    container.innerHTML =
        ownCampaigns
            .map(
                (campaign) =>
                    createCreatorCampaignHTML(
                        campaign
                    )
            )
            .join("");

}


/* =========================================================
   CREATOR CAMPAIGN HTML
========================================================= */

function createCreatorCampaignHTML(
    campaign
) {

    const target =
        Number(campaign.targetAmount) || 0;

    const collected =
        Number(campaign.collectedAmount) || 0;


    const percentage =
        target > 0
            ? Math.min(
                100,
                Math.round(
                    (collected / target) * 100
                )
            )
            : 0;


    const status =
        String(
            campaign.status || "PENDING"
        ).toUpperCase();


    const statusLabel =
        status;


    let message = "";


    if (status === "PENDING") {

        message = `
            <div class="status-message pending-message">
                Your campaign has been submitted.
                <strong>Admin will review and approve it.</strong>
                Contributors cannot see it until it is approved.
            </div>
        `;

    } else if (status === "REJECTED") {

        message = `
            <div class="status-message rejected-message">

                <strong>
                    Campaign Rejected
                </strong>

                <br>

                ${
                    escapeHTML(
                        campaign.rejectionReason ||
                        "No rejection reason provided."
                    )
                }

            </div>
        `;

    } else if (status === "APPROVED") {

        message = `
            <div class="status-message approved-message">
                Your campaign has been approved
                and is now visible to contributors.
            </div>
        `;

    } else if (status === "COMPLETED") {

        message = `
            <div class="status-message approved-message">
                Congratulations! Your campaign has
                reached its target.
            </div>
        `;

    }


    return `
        <div class="creator-campaign">

            <div class="creator-campaign-header">

                <div>

                    <h2>
                        ${escapeHTML(
                            campaign.title ||
                            "Untitled Campaign"
                        )}
                    </h2>

                    <p class="campaign-description">
                        ${escapeHTML(
                            campaign.description ||
                            "No description available."
                        )}
                    </p>

                </div>


                <span
                    class="status-badge ${getStatusClass(status)}"
                >
                    ${escapeHTML(statusLabel)}
                </span>

            </div>


            <div class="amount-row">

                <span>
                    Raised:
                    ${formatCurrency(collected)}
                    (${percentage}%)
                </span>

                <span>
                    Goal:
                    ${formatCurrency(target)}
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


            ${message}

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


        if (currentRole !== "CREATOR") {

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
            !Number.isFinite(target) ||
            target <= 0
        ) {

            showCampaignMessage(
                "Please enter a valid target amount.",
                true
            );

            return;

        }


        try {

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
                "Campaign created successfully. Admin will review and approve it.",
                false
            );


            switchDashboardSection(
                creatorDashboard,
                "creator-manage"
            );


        } catch (error) {

            console.error(
                "Create campaign error:",
                error
            );


            showCampaignMessage(
                "Unable to create campaign. Please try again.",
                true
            );

        }

    }
);


/* =========================================================
   CAMPAIGN MESSAGE
========================================================= */

function showCampaignMessage(
    message,
    isError
) {

    campaignMessage.textContent =
        message;


    campaignMessage.classList.add(
        isError
            ? "error-form-message"
            : "success-message"
    );

}


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


    if (campaigns.length === 0) {

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
                    a.createdAt?.seconds || 0;

                const bTime =
                    b.createdAt?.seconds || 0;

                return bTime - aTime;

            }
        );


    container.innerHTML =
        sortedCampaigns
            .map(
                (campaign) =>
                    createAdminCampaignRow(
                        campaign
                    )
            )
            .join("");

}


/* =========================================================
   ADMIN CAMPAIGN ROW
========================================================= */

function createAdminCampaignRow(
    campaign
) {

    const status =
        String(
            campaign.status || "PENDING"
        ).toUpperCase();


    let actions = "";


    if (
        status === "PENDING"
    ) {

        actions = `
            <div class="admin-actions">

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

    } else {

        actions = `
            <span class="table-muted">
                No actions
            </span>
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
                    ${escapeHTML(status)}
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
    async function (campaignId) {

        if (currentRole !== "ADMIN") {

            return;

        }


        const campaign =
            campaigns.find(
                (item) =>
                    item.id === campaignId
            );


        if (!campaign) {

            alert(
                "Campaign not found."
            );

            return;

        }


        if (
            String(
                campaign.status
            ).toUpperCase() !== "PENDING"
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


            alert(
                "Campaign approved successfully."
            );

        } catch (error) {

            console.error(
                "Approve error:",
                error
            );

            alert(
                "Unable to approve campaign."
            );

        }

    };


/* =========================================================
   ADMIN REJECT
========================================================= */

window.rejectCampaign =
    async function (campaignId) {

        if (currentRole !== "ADMIN") {

            return;

        }


        const campaign =
            campaigns.find(
                (item) =>
                    item.id === campaignId
            );


        if (!campaign) {

            alert(
                "Campaign not found."
            );

            return;

        }


        if (
            String(
                campaign.status
            ).toUpperCase() !== "PENDING"
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
            reason === null
        ) {

            return;

        }


        const finalReason =
            reason.trim() ||
            "Campaign rejected by administrator.";


        try {

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
                        finalReason,

                    rejectedBy:
                        currentUser.uid,

                    rejectedAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                }
            );


            alert(
                "Campaign rejected."
            );

        } catch (error) {

            console.error(
                "Reject error:",
                error
            );

            alert(
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


    if (users.length === 0) {

        container.innerHTML = `
            <tr>

                <td
                    colspan="3"
                    class="table-loading"
                >
                    No users found.
                </td>

            </tr>
        `;

        return;

    }


    container.innerHTML =
        users
            .map(
                (user) => {

                    const role =
                        String(
                            user.ROLE ||
                            "UNKNOWN"
                        ).toUpperCase();


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
                                        getRoleLabel(role)
                                    )}
                                </span>
                            </td>

                        </tr>
                    `;

                }
            )
            .join("");

}


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


                            switchDashboardSection(
                                dashboard,
                                sectionId
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


    dashboard
        .querySelectorAll(
            ".sidebar-item"
        )
        .forEach(
            (button) => {

                button.classList.toggle(
                    "active",
                    button.dataset.section ===
                    sectionId
                );

            }
        );


    dashboard
        .querySelectorAll(
            ".dashboard-section"
        )
        .forEach(
            (section) => {

                section.classList.toggle(
                    "hidden",
                    section.id !== sectionId
                );

            }
        );

}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(
    status
) {

    switch (
        String(status)
            .toUpperCase()
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
        String(role)
            .toUpperCase()
    ) {

        case "ADMIN":
            return "status-approved";

        case "CREATOR":
            return "status-pending";

        case "CONTRIBUTOR":
            return "status-approved";

        default:
            return "status-pending";

    }

}


/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(
    amount
) {

    const number =
        Number(amount) || 0;


    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2
        }
    ).format(number);

}


/* =========================================================
   TIMESTAMP
========================================================= */

function formatTimestamp(
    timestamp
) {

    if (
        !timestamp ||
        !timestamp.seconds
    ) {

        return "Recently";

    }


    const date =
        new Date(
            timestamp.seconds * 1000
        );


    return date.toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   INITIAL RENDER
========================================================= */

renderCampaigns();

renderUsers();

renderContributionHistory();