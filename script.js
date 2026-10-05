// ============================================================
// FIREBASE IMPORTS
// ============================================================

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
    runTransaction,
    serverTimestamp,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

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


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app =
    initializeApp(firebaseConfig);


const auth =
    getAuth(app);


const db =
    getFirestore(app);


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let currentUser = null;

let currentUserData = null;

// Firestore realtime listener
let campaignListener = null;


// ============================================================
// DOM ELEMENTS
// ============================================================

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


const loginError =
    document.getElementById(
        "loginError"
    );


const adminDashboard =
    document.getElementById(
        "adminDashboard"
    );


const contributorDashboard =
    document.getElementById(
        "contributorDashboard"
    );


const creatorDashboard =
    document.getElementById(
        "creatorDashboard"
    );


// ============================================================
// LOGIN
// ============================================================

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        loginError.textContent = "";


        const email =
            document
                .getElementById(
                    "loginEmail"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "loginPassword"
                )
                .value;


        if (
            !email ||
            !password
        ) {

            loginError.textContent =
                "Please enter email and password.";

            return;
        }


        try {

            // ------------------------------------------------
            // IMPORTANT
            //
            // browserSessionPersistence means:
            // each browser TAB has its own login session.
            //
            // Logout in Tab 1 will NOT logout Tab 2.
            // ------------------------------------------------

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
                "Login Error:",
                error
            );


            loginError.textContent =
                getLoginErrorMessage(
                    error.code
                );
        }
    }
);


// ============================================================
// LOGIN ERROR MESSAGE
// ============================================================

function getLoginErrorMessage(
    code
) {

    switch (code) {

        case "auth/invalid-credential":

            return "Invalid email or password.";


        case "auth/user-not-found":

            return "User not found.";


        case "auth/wrong-password":

            return "Incorrect password.";


        case "auth/invalid-email":

            return "Invalid email.";


        case "auth/too-many-requests":

            return "Too many login attempts. Try again later.";


        default:

            return "Login failed. Please try again.";
    }
}


// ============================================================
// AUTH STATE LISTENER
// ============================================================

onAuthStateChanged(
    auth,
    async function (user) {

        if (user) {

            currentUser =
                user;


            await loadUserRole();

        } else {

            currentUser =
                null;


            currentUserData =
                null;


            stopCampaignListener();


            showLoginPage();
        }
    }
);


// ============================================================
// LOAD USER ROLE
// ============================================================

async function loadUserRole() {

    try {

        const userRef =
            doc(
                db,
                "users",
                currentUser.uid
            );


        const userSnapshot =
            await getDoc(
                userRef
            );


        if (
            !userSnapshot.exists()
        ) {

            alert(
                "User profile not found in Firestore."
            );


            await signOut(
                auth
            );


            return;
        }


        currentUserData =
            userSnapshot.data();


        const role =
            currentUserData.ROLE;


        if (!role) {

            alert(
                "ROLE is missing for this user."
            );


            await signOut(
                auth
            );


            return;
        }


        // ----------------------------------------------------
        // SHOW APPLICATION
        // ----------------------------------------------------

        showApplication();


        // ----------------------------------------------------
        // SHOW ROLE DASHBOARD
        // ----------------------------------------------------

        await showDashboard(
            role
        );


        // ----------------------------------------------------
        // START REALTIME LISTENER
        // ----------------------------------------------------

        startCampaignListener();


    } catch (error) {

        console.error(
            "Load User Role Error:",
            error
        );


        alert(
            "Unable to load user profile."
        );
    }
}


// ============================================================
// SHOW LOGIN PAGE
// ============================================================

function showLoginPage() {

    if (loginPage) {

        loginPage.classList.remove(
            "hidden"
        );
    }


    if (appPage) {

        appPage.classList.add(
            "hidden"
        );
    }


    hideAllDashboards();
}


// ============================================================
// SHOW APPLICATION
// ============================================================

function showApplication() {

    if (loginPage) {

        loginPage.classList.add(
            "hidden"
        );
    }


    if (appPage) {

        appPage.classList.remove(
            "hidden"
        );
    }


    const userName =
        document.getElementById(
            "userName"
        );


    const userRole =
        document.getElementById(
            "userRole"
        );


    if (userName) {

        userName.textContent =
            currentUserData.name ||
            currentUser.email;
    }


    if (userRole) {

        userRole.textContent =
            currentUserData.ROLE;
    }
}


// ============================================================
// HIDE ALL DASHBOARDS
// ============================================================

function hideAllDashboards() {

    if (adminDashboard) {

        adminDashboard.classList.add(
            "hidden"
        );
    }


    if (contributorDashboard) {

        contributorDashboard.classList.add(
            "hidden"
        );
    }


    if (creatorDashboard) {

        creatorDashboard.classList.add(
            "hidden"
        );
    }
}


// ============================================================
// SHOW DASHBOARD BASED ON ROLE
// ============================================================

async function showDashboard(
    role
) {

    hideAllDashboards();


    // ========================================================
    // ADMIN
    // ========================================================

    if (
        role === "ADMIN"
    ) {

        adminDashboard.classList.remove(
            "hidden"
        );

        return;
    }


    // ========================================================
    // CONTRIBUTOR
    // ========================================================

    if (
        role === "CONTRIBUTOR"
    ) {

        contributorDashboard.classList.remove(
            "hidden"
        );

        return;
    }


    // ========================================================
    // CREATOR
    // ========================================================

    if (
        role === "CREATOR"
    ) {

        creatorDashboard.classList.remove(
            "hidden"
        );

        return;
    }


    // ========================================================
    // INVALID ROLE
    // ========================================================

    alert(
        "Invalid ROLE: " + role
    );


    await logoutUser();
}


// ============================================================
// LOGOUT
// ============================================================

window.logoutUser =
    async function () {

        try {

            stopCampaignListener();


            await signOut(
                auth
            );


        } catch (error) {

            console.error(
                "Logout Error:",
                error
            );
        }
    };


// ============================================================
// REALTIME FIRESTORE LISTENER
// ============================================================
//
// This is the main feature.
//
// Whenever ANY campaign changes in Firestore:
//
// CREATE
// APPROVE
// REJECT
// CONTRIBUTION
// COMPLETION
//
// the UI automatically updates WITHOUT PAGE RELOAD.
// ============================================================

function startCampaignListener() {

    // --------------------------------------------------------
    // Remove previous listener if any
    // --------------------------------------------------------

    stopCampaignListener();


    const campaignsRef =
        collection(
            db,
            "campaigns"
        );


    campaignListener =
        onSnapshot(
            campaignsRef,

            function (snapshot) {

                const campaigns =
                    [];


                snapshot.forEach(
                    function (
                        docSnapshot
                    ) {

                        campaigns.push({

                            id:
                                docSnapshot.id,

                            data:
                                docSnapshot.data()
                        });
                    }
                );


                // ------------------------------------------------
                // SORT NEWEST FIRST
                // ------------------------------------------------

                campaigns.sort(
                    function (
                        a,
                        b
                    ) {

                        const dateA =
                            a.data.createdAt
                                ?.toMillis?.() ||
                            0;


                        const dateB =
                            b.data.createdAt
                                ?.toMillis?.() ||
                            0;


                        return (
                            dateB -
                            dateA
                        );
                    }
                );


                // ------------------------------------------------
                // ADMIN
                // ------------------------------------------------

                if (
                    currentUserData &&
                    currentUserData.ROLE ===
                    "ADMIN"
                ) {

                    renderAdminCampaigns(
                        campaigns
                    );
                }


                // ------------------------------------------------
                // CREATOR
                // ------------------------------------------------

                if (
                    currentUserData &&
                    currentUserData.ROLE ===
                    "CREATOR"
                ) {

                    renderCreatorCampaigns(
                        campaigns
                    );
                }


                // ------------------------------------------------
                // CONTRIBUTOR
                // ------------------------------------------------

                if (
                    currentUserData &&
                    currentUserData.ROLE ===
                    "CONTRIBUTOR"
                ) {

                    renderContributorCampaigns(
                        campaigns
                    );
                }

            },

            function (error) {

                console.error(
                    "Realtime Listener Error:",
                    error
                );


                const containers = [

                    "adminCampaigns",

                    "creatorCampaigns",

                    "contributorCampaigns"

                ];


                containers.forEach(
                    function (id) {

                        const container =
                            document.getElementById(
                                id
                            );


                        if (container) {

                            container.innerHTML = `
                                <p class="empty-message">
                                    Unable to load campaigns.
                                </p>
                            `;
                        }
                    }
                );
            }
        );
}


// ============================================================
// STOP REALTIME LISTENER
// ============================================================

function stopCampaignListener() {

    if (
        campaignListener
    ) {

        campaignListener();


        campaignListener =
            null;
    }
}


// ============================================================
// CREATE CAMPAIGN
// ============================================================

const campaignForm =
    document.getElementById(
        "campaignForm"
    );


if (campaignForm) {

    campaignForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


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


            const targetAmount =
                Number(
                    document
                        .getElementById(
                            "campaignTarget"
                        )
                        .value
                );


            const message =
                document.getElementById(
                    "campaignMessage"
                );


            message.textContent =
                "";


            // ------------------------------------------------
            // VALIDATION
            // ------------------------------------------------

            if (!title) {

                message.textContent =
                    "Please enter campaign name.";

                message.className =
                    "error-message";

                return;
            }


            if (!description) {

                message.textContent =
                    "Please enter campaign description.";

                message.className =
                    "error-message";

                return;
            }


            if (
                !Number.isFinite(
                    targetAmount
                ) ||
                targetAmount <= 0
            ) {

                message.textContent =
                    "Target amount must be greater than 0.";

                message.className =
                    "error-message";

                return;
            }


            try {

                // ------------------------------------------------
                // CREATE PENDING CAMPAIGN
                // ------------------------------------------------

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
                            targetAmount,

                        collectedAmount:
                            0,

                        creatorId:
                            currentUser.uid,

                        creatorName:
                            currentUserData.name ||
                            currentUser.email,

                        status:
                            "PENDING",

                        rejectionReason:
                            "",

                        createdAt:
                            serverTimestamp()
                    }
                );


                message.textContent =
                    "Campaign created successfully. Waiting for admin approval.";


                message.className =
                    "success-message";


                campaignForm.reset();


                // ------------------------------------------------
                // IMPORTANT:
                //
                // No need to call loadCreatorCampaigns().
                //
                // onSnapshot() automatically detects the
                // newly created campaign.
                // ------------------------------------------------

            } catch (error) {

                console.error(
                    "Create Campaign Error:",
                    error
                );


                message.textContent =
                    "Failed to create campaign.";


                message.className =
                    "error-message";
            }
        }
    );
}


// ============================================================
// RENDER CREATOR CAMPAIGNS
// ============================================================

function renderCreatorCampaigns(
    campaigns
) {

    const container =
        document.getElementById(
            "creatorCampaigns"
        );


    if (!container) {

        return;
    }


    const myCampaigns =
        campaigns.filter(
            function (
                campaign
            ) {

                return (
                    campaign.data.creatorId ===
                    currentUser.uid
                );
            }
        );


    if (
        myCampaigns.length === 0
    ) {

        container.innerHTML = `
            <p class="empty-message">
                You have not created any campaigns yet.
            </p>
        `;

        return;
    }


    container.innerHTML =
        "";


    myCampaigns.forEach(
        function (
            campaign
        ) {

            container.innerHTML +=
                createCreatorCampaignCard(
                    campaign.id,
                    campaign.data
                );
        }
    );
}


// ============================================================
// CREATOR CAMPAIGN CARD
// ============================================================

function createCreatorCampaignCard(
    id,
    campaign
) {

    const status =
        campaign.status ||
        "PENDING";


    const collected =
        Number(
            campaign.collectedAmount ||
            0
        );


    const target =
        Number(
            campaign.targetAmount ||
            0
        );


    const progress =
        target > 0
            ? Math.min(
                (
                    collected /
                    target
                ) * 100,
                100
            )
            : 0;


    // ========================================================
    // PENDING
    // ========================================================

    if (
        status === "PENDING"
    ) {

        return `
            <div class="campaign-card">

                <span class="status-badge status-pending">
                    PENDING ADMIN APPROVAL
                </span>


                <h3>
                    ${escapeHTML(
                        campaign.title
                    )}
                </h3>


                <p class="campaign-description">
                    ${escapeHTML(
                        campaign.description
                    )}
                </p>


                <div class="approval-message">

                    <strong>
                        ⏳ Admin approval required
                    </strong>

                    <p>
                        Your campaign has been submitted successfully.
                        Admin will review and approve it before it becomes
                        available to contributors.
                    </p>

                </div>


                <div class="campaign-info">

                    <div class="info-item">

                        <div class="info-label">
                            Target
                        </div>

                        <div class="info-value">
                            ₹${target}
                        </div>

                    </div>

                </div>

            </div>
        `;
    }


    // ========================================================
    // REJECTED
    // ========================================================

    if (
        status === "REJECTED"
    ) {

        return `
            <div class="campaign-card">

                <span class="status-badge status-rejected">
                    REJECTED
                </span>


                <h3>
                    ${escapeHTML(
                        campaign.title
                    )}
                </h3>


                <p class="campaign-description">
                    ${escapeHTML(
                        campaign.description
                    )}
                </p>


                <div class="rejection-message">

                    <strong>
                        Campaign Rejected
                    </strong>

                    <p>
                        ${escapeHTML(
                            campaign.rejectionReason ||
                            "No reason provided."
                        )}
                    </p>

                </div>


                <div class="campaign-info">

                    <div class="info-item">

                        <div class="info-label">
                            Target
                        </div>

                        <div class="info-value">
                            ₹${target}
                        </div>

                    </div>

                </div>

            </div>
        `;
    }


    // ========================================================
    // COMPLETED
    // ========================================================

    if (
        status === "COMPLETED"
    ) {

        return `
            <div class="campaign-card">

                <span class="status-badge status-completed">
                    COMPLETED
                </span>


                <h3>
                    ${escapeHTML(
                        campaign.title
                    )}
                </h3>


                <p class="campaign-description">
                    ${escapeHTML(
                        campaign.description
                    )}
                </p>


                <div class="approved-message">

                    <strong>
                        ✓ Campaign Completed
                    </strong>

                    <p>
                        Your campaign has reached its target amount.
                    </p>

                </div>


                ${createProgressHTML(
                    target,
                    collected
                )}

            </div>
        `;
    }


    // ========================================================
    // APPROVED
    // ========================================================

    return `
        <div class="campaign-card">

            <span class="status-badge status-approved">
                APPROVED
            </span>


            <h3>
                ${escapeHTML(
                    campaign.title
                )}
            </h3>


            <p class="campaign-description">
                ${escapeHTML(
                    campaign.description
                )}
            </p>


            <div class="approved-message">

                <strong>
                    ✓ Campaign Approved
                </strong>

                <p>
                    Your campaign has been approved by the admin
                    and is now available to contributors.
                </p>

            </div>


            ${createProgressHTML(
                target,
                collected
            )}

        </div>
    `;
}


// ============================================================
// ADMIN - RENDER CAMPAIGNS
// ============================================================

function renderAdminCampaigns(
    campaigns
) {

    const container =
        document.getElementById(
            "adminCampaigns"
        );


    if (!container) {

        return;
    }


    const pendingCampaigns =
        campaigns.filter(
            function (
                campaign
            ) {

                return (
                    campaign.data.status ===
                    "PENDING"
                );
            }
        );


    if (
        pendingCampaigns.length ===
        0
    ) {

        container.innerHTML = `
            <p class="empty-message">
                No pending campaigns.
            </p>
        `;

        return;
    }


    container.innerHTML =
        "";


    pendingCampaigns.forEach(
        function (
            campaign
        ) {

            container.innerHTML +=
                createAdminCampaignCard(
                    campaign.id,
                    campaign.data
                );
        }
    );
}


// ============================================================
// ADMIN CAMPAIGN CARD
// ============================================================

function createAdminCampaignCard(
    id,
    campaign
) {

    const target =
        Number(
            campaign.targetAmount ||
            0
        );


    return `
        <div class="campaign-card">

            <span class="status-badge status-pending">
                PENDING
            </span>


            <h3>
                ${escapeHTML(
                    campaign.title
                )}
            </h3>


            <p class="campaign-description">
                ${escapeHTML(
                    campaign.description
                )}
            </p>


            <div class="campaign-info">

                <div class="info-item">

                    <div class="info-label">
                        Creator
                    </div>

                    <div class="info-value">
                        ${escapeHTML(
                            campaign.creatorName ||
                            "Unknown"
                        )}
                    </div>

                </div>


                <div class="info-item">

                    <div class="info-label">
                        Target
                    </div>

                    <div class="info-value">
                        ₹${target}
                    </div>

                </div>

            </div>


            <div class="admin-buttons">

                <button
                    class="approve-button"
                    onclick="approveCampaign('${id}')"
                >
                    Approve
                </button>


                <button
                    class="reject-button"
                    onclick="rejectCampaign('${id}')"
                >
                    Reject
                </button>

            </div>

        </div>
    `;
}


// ============================================================
// ADMIN - APPROVE
// ============================================================

window.approveCampaign =
    async function (
        id
    ) {

        try {

            const campaignRef =
                doc(
                    db,
                    "campaigns",
                    id
                );


            await updateDoc(
                campaignRef,
                {

                    status:
                        "APPROVED",

                    rejectionReason:
                        ""
                }
            );


            alert(
                "Campaign approved successfully."
            );


            // ------------------------------------------------
            // NO MANUAL REFRESH NEEDED
            //
            // onSnapshot() automatically updates:
            // ADMIN
            // CREATOR
            // CONTRIBUTOR
            // ------------------------------------------------

        } catch (error) {

            console.error(
                "Approve Error:",
                error
            );


            alert(
                "Failed to approve campaign."
            );
        }
    };


// ============================================================
// ADMIN - REJECT
// ============================================================

window.rejectCampaign =
    async function (
        id
    ) {

        const reason =
            prompt(
                "Enter rejection reason:"
            );


        if (
            reason === null
        ) {

            return;
        }


        if (
            !reason.trim()
        ) {

            alert(
                "Please enter a rejection reason."
            );

            return;
        }


        try {

            const campaignRef =
                doc(
                    db,
                    "campaigns",
                    id
                );


            await updateDoc(
                campaignRef,
                {

                    status:
                        "REJECTED",

                    rejectionReason:
                        reason.trim()
                }
            );


            alert(
                "Campaign rejected."
            );


            // No reload needed.

        } catch (error) {

            console.error(
                "Reject Error:",
                error
            );


            alert(
                "Failed to reject campaign."
            );
        }
    };


// ============================================================
// CONTRIBUTOR - RENDER CAMPAIGNS
// ============================================================

function renderContributorCampaigns(
    campaigns
) {

    const container =
        document.getElementById(
            "contributorCampaigns"
        );


    if (!container) {

        return;
    }


    // --------------------------------------------------------
    // ONLY APPROVED CAMPAIGNS
    // --------------------------------------------------------

    const approvedCampaigns =
        campaigns.filter(
            function (
                campaign
            ) {

                return (
                    campaign.data.status ===
                    "APPROVED"
                );
            }
        );


    if (
        approvedCampaigns.length ===
        0
    ) {

        container.innerHTML = `
            <p class="empty-message">
                No approved campaigns available.
            </p>
        `;

        return;
    }


    container.innerHTML =
        "";


    approvedCampaigns.forEach(
        function (
            campaign
        ) {

            container.innerHTML +=
                createContributorCampaignCard(
                    campaign.id,
                    campaign.data
                );
        }
    );
}


// ============================================================
// CONTRIBUTOR CAMPAIGN CARD
// ============================================================

function createContributorCampaignCard(
    id,
    campaign
) {

    const collected =
        Number(
            campaign.collectedAmount ||
            0
        );


    const target =
        Number(
            campaign.targetAmount ||
            0
        );


    const progress =
        target > 0
            ? Math.min(
                (
                    collected /
                    target
                ) * 100,
                100
            )
            : 0;


    return `
        <div class="campaign-card">

            <span class="status-badge status-approved">
                APPROVED
            </span>


            <h3>
                ${escapeHTML(
                    campaign.title
                )}
            </h3>


            <p class="campaign-description">
                ${escapeHTML(
                    campaign.description
                )}
            </p>


            <div class="campaign-info">

                <div class="info-item">

                    <div class="info-label">
                        Creator
                    </div>

                    <div class="info-value">
                        ${escapeHTML(
                            campaign.creatorName ||
                            "Unknown"
                        )}
                    </div>

                </div>


                <div class="info-item">

                    <div class="info-label">
                        Target
                    </div>

                    <div class="info-value">
                        ₹${target}
                    </div>

                </div>


                <div class="info-item">

                    <div class="info-label">
                        Collected
                    </div>

                    <div class="info-value">
                        ₹${collected}
                    </div>

                </div>

            </div>


            <div class="progress-container">

                <div class="progress-background">

                    <div
                        class="progress-bar"
                        style="width: ${progress}%"
                    ></div>

                </div>


                <div class="progress-text">
                    ${progress.toFixed(1)}% funded
                </div>

            </div>


            <div class="donation-box">

                <input
                    type="number"
                    id="donation-${id}"
                    placeholder="Contribution amount"
                    min="1"
                >


                <button
                    class="donate-button"
                    onclick="donateToCampaign('${id}')"
                >
                    Contribute
                </button>

            </div>

        </div>
    `;
}


// ============================================================
// CONTRIBUTOR - DONATE
// ============================================================

window.donateToCampaign =
    async function (
        campaignId
    ) {

        const input =
            document.getElementById(
                `donation-${campaignId}`
            );


        if (!input) {

            alert(
                "Contribution input not found."
            );

            return;
        }


        const amount =
            Number(
                input.value
            );


        if (
            !Number.isFinite(
                amount
            ) ||
            amount <= 0
        ) {

            alert(
                "Enter a valid contribution amount."
            );

            return;
        }


        try {

            const campaignRef =
                doc(
                    db,
                    "campaigns",
                    campaignId
                );


            await runTransaction(
                db,

                async function (
                    transaction
                ) {

                    // ----------------------------------------
                    // GET CAMPAIGN
                    // ----------------------------------------

                    const campaignSnapshot =
                        await transaction.get(
                            campaignRef
                        );


                    if (
                        !campaignSnapshot.exists()
                    ) {

                        throw new Error(
                            "Campaign not found."
                        );
                    }


                    const campaign =
                        campaignSnapshot.data();


                    // ----------------------------------------
                    // ONLY APPROVED CAMPAIGNS
                    // ----------------------------------------

                    if (
                        campaign.status !==
                        "APPROVED"
                    ) {

                        throw new Error(
                            "This campaign is not available for contribution."
                        );
                    }


                    const currentAmount =
                        Number(
                            campaign.collectedAmount ||
                            0
                        );


                    const targetAmount =
                        Number(
                            campaign.targetAmount ||
                            0
                        );


                    // ----------------------------------------
                    // CHECK COMPLETION
                    // ----------------------------------------

                    if (
                        currentAmount >=
                        targetAmount
                    ) {

                        throw new Error(
                            "This campaign is already completed."
                        );
                    }


                    // ----------------------------------------
                    // REMAINING
                    // ----------------------------------------

                    const remaining =
                        targetAmount -
                        currentAmount;


                    if (
                        amount >
                        remaining
                    ) {

                        throw new Error(
                            `Maximum contribution allowed is ₹${remaining}.`
                        );
                    }


                    // ----------------------------------------
                    // NEW TOTAL
                    // ----------------------------------------

                    const newAmount =
                        currentAmount +
                        amount;


                    // ----------------------------------------
                    // NEW STATUS
                    // ----------------------------------------

                    const newStatus =
                        newAmount >=
                        targetAmount

                            ? "COMPLETED"

                            : "APPROVED";


                    // ----------------------------------------
                    // UPDATE CAMPAIGN
                    // ----------------------------------------

                    transaction.update(
                        campaignRef,
                        {

                            collectedAmount:
                                newAmount,

                            status:
                                newStatus
                        }
                    );


                    // ----------------------------------------
                    // CREATE DONATION RECORD
                    // ----------------------------------------

                    const donationRef =
                        doc(
                            collection(
                                db,
                                "donations"
                            )
                        );


                    transaction.set(
                        donationRef,
                        {

                            campaignId:
                                campaignId,

                            contributorId:
                                currentUser.uid,

                            contributorName:
                                currentUserData.name ||
                                currentUser.email,

                            amount:
                                amount,

                            createdAt:
                                serverTimestamp()
                        }
                    );
                }
            );


            alert(
                "Contribution successful!"
            );


            input.value = "";


            // ------------------------------------------------
            // NO RELOAD
            //
            // Firestore onSnapshot() will automatically
            // update the campaign card.
            // ------------------------------------------------

        } catch (error) {

            console.error(
                "Contribution Error:",
                error
            );


            alert(
                error.message ||
                "Contribution failed."
            );
        }
    };


// ============================================================
// PROGRESS HTML
// ============================================================

function createProgressHTML(
    target,
    collected
) {

    const progress =
        target > 0
            ? Math.min(
                (
                    collected /
                    target
                ) * 100,
                100
            )
            : 0;


    return `

        <div class="campaign-info">

            <div class="info-item">

                <div class="info-label">
                    Target
                </div>

                <div class="info-value">
                    ₹${target}
                </div>

            </div>


            <div class="info-item">

                <div class="info-label">
                    Collected
                </div>

                <div class="info-value">
                    ₹${collected}
                </div>

            </div>

        </div>


        <div class="progress-container">

            <div class="progress-background">

                <div
                    class="progress-bar"
                    style="width: ${progress}%"
                ></div>

            </div>


            <div class="progress-text">

                ${progress.toFixed(1)}% funded

            </div>

        </div>
    `;
}


// ============================================================
// STATUS CLASS
// ============================================================

function getStatusClass(
    status
) {

    switch (status) {

        case "PENDING":

            return "status-pending";


        case "APPROVED":

            return "status-approved";


        case "REJECTED":

            return "status-rejected";


        case "COMPLETED":

            return "status-completed";


        default:

            return "status-pending";
    }
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(
    value
) {

    return String(
        value || ""
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