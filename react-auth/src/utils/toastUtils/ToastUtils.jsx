import { toast } from "react-toastify";

export const showSuccessToast = (message) => {
    toast.success(message, {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        toastStyle: {
            background:"#1C2833",// Change background color
            color: "#1ABC9C",         // Change text color
        },
        bodyClassName: "custom-toast-body", // Apply custom CSS class to toast body
    });
};


export const showErrorToast = (errorMessage) => {
    toast.error(errorMessage, {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        progress: undefined,
        toastStyle: {
            background: "#dc3545", // Change background color
            color: "#fff",        // Change text color
        },
        bodyClassName: "custom-toast-body", // Apply custom CSS class to toast body
    });
};
