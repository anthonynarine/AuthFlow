import PeopleAndApplications from "./PeopleAndApplications";
import GettingStarted from "./GettingStarted";
import ConnectingYourSoftware from "./ConnectingYourSoftware";
import SecurityChecksAndFindings from "./SecurityChecksAndFindings";
import TeamsRolesAndInvites from "./TeamsRolesAndInvites";
import ApplicationsAndConnectionKeys from "./ApplicationsAndConnectionKeys";
import Troubleshooting from "./Troubleshooting";

/** Page body per slug. Titles and order live in ../manifest.js. */
export const DOC_CONTENT = {
    "people-and-applications": PeopleAndApplications,
    "getting-started": GettingStarted,
    "connecting-your-software": ConnectingYourSoftware,
    "security-checks-and-findings": SecurityChecksAndFindings,
    "teams-roles-and-invites": TeamsRolesAndInvites,
    "applications-and-connection-keys": ApplicationsAndConnectionKeys,
    troubleshooting: Troubleshooting,
};
