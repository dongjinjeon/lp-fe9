import CryptoJS from 'crypto-js';
import api from "./api";

const AES_Encode = (str: string, key: string, iv: string): string => {
  const textBytes = CryptoJS.enc.Utf8.parse(str);
  const keyBytes = CryptoJS.enc.Utf8.parse(key);
  const ivBytes = CryptoJS.enc.Utf8.parse(iv);

  const encrypted = CryptoJS.AES.encrypt(textBytes, keyBytes, {
    iv: ivBytes,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return encrypted.toString();
};


const AES_Decode = (str: string, key: string, iv: string): string => {
  const keyBytes = CryptoJS.enc.Utf8.parse(key);
  const ivBytes = CryptoJS.enc.Utf8.parse(iv);

  const decrypted = CryptoJS.AES.decrypt(str, keyBytes, {
    iv: ivBytes,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
};

export const paymentsAPI = api.injectEndpoints({
  endpoints: (builder) => ({
    prepare: builder.mutation<any, { token: string, productId: number }>({
      query: ({token, productId}) => ({
        url: `/v1/client/web-site/payment/prepare`,
        method: "POST",
        body: {
          productId: productId,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `bearer ${token}`,
        },
      }),
      transformResponse: (rawResult: any, meta) => {
        return rawResult;
      },
    }),
    paymentsConfirm: builder.mutation<any, { token: string, paymentKey: string, orderId: string, amount: number }>({
      query: ({token, paymentKey, orderId, amount}) => ({
        url: `/v1/client/web-site/payment/confirm`,
        method: "POST",
        body: {
          paymentKey: paymentKey,
          orderId: orderId,
          amount: amount,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `bearer ${token}`,
        },
      }),
      transformResponse: (rawResult: any, meta) => {
        return rawResult;
      },
    }),
    getChargeList: builder.mutation<any, any>({
      query: (body) => ({
        url: `/v1/client/charge/search`,
        method: "POST",
        body: {
          ...body,
        },
      }),
      transformResponse: (rawResult: any, meta) => {
        return rawResult.data.data;
      },
    }),
    getLPointBalance: builder.mutation<any, { token: string; cardNumber: string }>({
      query: ({ token, cardNumber }) => ({
        url: `/v1/client/web-site/Lpoint/balance`,
        method: "POST",
        body: {
          lpoint_card_number: cardNumber,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
      transformResponse: (rawResult: any, meta) => {
        return rawResult;
      },
    }),

    registerLPointCard: builder.mutation<any, { token: string; cardNumber: string }>({
      query: ({ token, cardNumber }) => ({
        url: `/v1/client/web-site/Lpoint/register`,
        method: "POST",
        body: {
          lpoint_card_number: cardNumber,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
      transformResponse: (rawResult: any, meta) => {
        return rawResult;
      },
    }),

    checkLPointCard: builder.mutation<any, { token: string }>({
      query: ({ token }) => ({
        url: `/v1/client/web-site/Lpoint/check`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
      transformResponse: (rawResult: any, meta) => {
        return rawResult;
      },
    }),

    lPointPrepare: builder.mutation<any, { token: string; productId: number; amount: number; productName: string }>({
      query: ({ token, productId, amount, productName }) => ({
        url: `/v1/client/web-site/Lpoint/prepare`,
        method: "POST",
        body: {
          productId: productId,
          amount: amount,
          productName: productName
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
      transformResponse: (rawResult: any) => rawResult,
    }),

    lPointConfirm: builder.mutation<any, { token: string; aprvMgNo: string }>({
      query: ({ token, aprvMgNo }) => ({
        url: `/v1/client/web-site/Lpoint/confirm`,
        method: "POST",
        body: {
          aprvMgNo: aprvMgNo,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
      transformResponse: (rawResult: any) => rawResult,
    }),


    useLPoint: builder.mutation<any, { token: string; deChnlDvC: string; mcNo: string; aprvMgNo: string }>({
      query: ({ token, deChnlDvC, mcNo, aprvMgNo }) => ({
        url: `/v1/client/web-site/Lpoint/use`, // 
        method: "POST",
        body: {
          deChnlDvC,
          mcNo,
          aprvMgNo
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
      transformResponse: (rawResult: any) => rawResult,
    }),

    searchLPointPayments: builder.mutation<any, { token: string; startDate: string; endDate: string; page: number; count: number }>({
      query: ({ token, startDate, endDate, page, count }) => ({
        url: `/v1/client/web-site/Lpoint/search`,
        method: "POST",
        body: {
          startDate,
          endDate,
          page,
          count
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
      transformResponse: (rawResult: any) => rawResult,
    }),

    
    cancelLPointPayment: builder.mutation<any, { token: string; orderId: string }>({
      query: ({ token, orderId }) => ({
        url: `/v1/client/web-site/Lpoint/cancel`,
        method: "POST",
        body: {
          orderId: orderId,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          'Access-Control-Allow-Origin': '*',
        },
      }),
      transformResponse: (rawResult: any) => rawResult,
    }),

  }),
});

export const {
  usePrepareMutation,
  usePaymentsConfirmMutation,
  useGetChargeListMutation,
  useGetLPointBalanceMutation,
  useRegisterLPointCardMutation, 
  useCheckLPointCardMutation, 
  useLPointPrepareMutation,
  useLPointConfirmMutation,
  useUseLPointMutation,
  useSearchLPointPaymentsMutation, 
  useCancelLPointPaymentMutation, 
} = paymentsAPI;
