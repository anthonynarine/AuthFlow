import axios from "axios";

axios.defaults.baseURL = "https://ant-django-auth-62cf01255868.herokuapp.com";

axios.interceptors.response.use(response => response, async error => {
    if (error.response && error.response.status === 401) {
        try {
            const response = await axios.post("/api/token-girefresh/", {}, {withCredentials: true});
            if (response.status === 200) {
                axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.access_token}`;
                return axios(error.config);
            }
            
        } catch (error) {
            
        }
    }

    return error;

});