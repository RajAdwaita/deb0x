import { createContext } from "react";

export const initialContacts = {
    contacts: [{
        name: "Adwaita Raj Modak",
        address: "0xeAC13bE5B42Ac1728CbB985a19473C4422Caccc5"
    }],
    setContacts: (_values: any) => {}
}

const ContactsContext = createContext(initialContacts);
export default ContactsContext;
