import axios from "axios";

axios.defaults.baseURL = "http://localhost:8000/api/";

axios.interceptors.response.use( response => response, async error => {
    if(error.response.status === 401) {
        const response = await axios.post("token-refresh/", {}, {
            withCredentials: true
        });

        if (response.status === 200) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.access_token}`

            return axios(error.config);
        }

        if (response.status === 500){
            console.log("failed")
        }
    }

    return error;
})