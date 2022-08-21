import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'

export default class Api {
  axios: AxiosInstance
  url = import.meta.env.VITE_API_URL

  constructor() {
    const options = {
      baseURL: this.url,
    }

    const interceptor = (config: AxiosRequestConfig) => {
      let token = Cookies.get('token')
      token = import.meta.env.VITE_TEMP_TOKEN
      if (token && config.headers) {
        config.headers.Authorization = token as string
      }
      return config
    }

    this.axios = axios.create(options)
    this.axios.interceptors.request.use(interceptor, Promise.reject)
  }

  makeForm<D extends Record<string, any>>(data: D) {
    const formData = new FormData()
    ;(Object.keys(data) as (keyof D)[]).forEach((_key: keyof D) => {
      const key = _key as string
      const val = data[key]
      formData.append(key, val as string)
    })
    return formData
  }
}
