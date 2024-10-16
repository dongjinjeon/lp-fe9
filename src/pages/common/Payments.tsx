import { Header } from "@components/Header";
import { Loading } from "@components/Loading";
import PaymentSuccessPopup from '@components/Popup/PaymentSuccessPopup';
import { PaymentContext } from "@context/PaymentContext";
import { UserContext } from "@context/UserContext";
import { useAppDispatch, useAppSelector } from "@store";
import { ReactComponent as CircleC } from "@svg/CircleC.svg";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ConfirmPopup from "../../components/Popup/ConfirmPopup";
import LPointCardForm from '../../components/Popup/LPointCardForm';
import { useCheckLPointCardMutation, useGetLPointBalanceMutation, useLPointConfirmMutation, useLPointPrepareMutation, useUseLPointMutation } from "../../redux/services/payments";
import { setBalance } from "../../store/slices/globalUserSlice";

interface DataItem {
  Id: string;
  productId: string;
  default_coin: number;
  bonus_coin: number;
  price: number;
  language: string;
  os: string;
}

const Payments = () => {
  const dispatch = useAppDispatch();
  const { balance } = useAppSelector((state) => state.storage.session.globalUserSlice);
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, userName, session_token } = useContext(UserContext);
 
  const { executePreparePayment, executeGetChargeList } = useContext(PaymentContext);
  const [data, setData] = useState<DataItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [isAgreementChecked, setIsAgreementChecked] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
  const tossPayments = useRef(null);
  const query = new URLSearchParams(location.search);
  const [isLpointFormOpen, setIsLpointFormOpen] = useState(false);
  const [lpointBalance, setLpointBalance] = useState<number | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [getLPointBalance] = useGetLPointBalanceMutation();
  const [lpointAvailablePoints, setLpointAvailablePoints] = useState<number | null>(() => {
    const savedPoints = localStorage.getItem('lpointAvailablePoints');
    return savedPoints ? Number(savedPoints) : null;
  });
  const [isCardRegistered, setIsCardRegistered] = useState<boolean>(false);
  const [checkLPointCard] = useCheckLPointCardMutation();
  const [lPointPrepare] = useLPointPrepareMutation();
  const [lPointConfirm] = useLPointConfirmMutation();
  const [useLPoint] = useUseLPointMutation();

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {

  }, [balance]);

  useEffect(() => {
    const loadToss = async () => {
      // @ts-ignore
      tossPayments.current = await loadTossPayments("live_ck_AQ92ymxN34R0R9vaqXbArajRKXvd");
    };
    loadToss();
  }, [data]);

  useEffect(() => {
    if (userId && userId <= -1) {
      navigate("/login");
    } else {
      fetchChargeList();
      if (session_token) {
        checkLPointCardStatus();
      }
    }
  }, [userId, session_token]);

  useEffect(() => {
    if (lpointAvailablePoints !== null) {
      localStorage.setItem('lpointAvailablePoints', lpointAvailablePoints.toString());
    } else {
      localStorage.removeItem('lpointAvailablePoints');
    }
  }, [lpointAvailablePoints]);

  useEffect(() => {
    localStorage.setItem('isCardRegistered', isCardRegistered.toString());
  }, [isCardRegistered]);

  useEffect(() => {
    const handleLPointMessage = (event: MessageEvent) => {
      if (event.origin !== "https://dev.lw.lpoint.com:2943") return;
      const data = event.data;
      if (data.rspC === "00") {
        console.log("L.POINT 결제 성공");
        confirmLPointPayment(data.aprvMgNo);
      } else {
        console.error("L.POINT 결제 실패:", data);
        setConfirmationMessage(decodeURIComponent(escape(data.rspMsgC || "결제에 실패했습니다. 다시 시도해 주세요.")));
      }
    };

    window.addEventListener("message", handleLPointMessage);

    return () => {
      window.removeEventListener("message", handleLPointMessage);
    };
  }, []);

  const checkLPointCardStatus = async () => {
    if (session_token) {
      try {
        const response = await checkLPointCard({ token: session_token }).unwrap();

        if (response.code === 200 && response.data && response.data.data) {
          if (response.data.data.valid === 1) {

            setIsCardRegistered(true);

            await fetchLPointBalance();
          } else {

            setIsCardRegistered(false);
            setLpointAvailablePoints(null);
          }
        } else {

          setIsCardRegistered(false);
          setLpointAvailablePoints(null);
        }
      } catch (error) {

        setIsCardRegistered(false);
        setLpointAvailablePoints(null);
      }
    } else {

    }
  };

  const fetchLPointBalance = async () => {
    if (session_token) {
      try {
        const balanceResponse = await getLPointBalance({ token: session_token, cardNumber: "" }).unwrap();
        if (balanceResponse.code === 200 && balanceResponse.data && balanceResponse.data.data) {
          setLpointAvailablePoints(balanceResponse.data.data.avlPt);
        }
      } catch (error) {
        console.error('Error fetching L.Point balance:', error);
        setLpointAvailablePoints(null);
      }
    }
  };

  const fetchChargeList = async () => {
    try {
      const response = await executeGetChargeList();
      setData(response.data.list);
    } catch (error) {
      console.error("Failed to fetch charge list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmLPointPayment = async (aprvMgNo: string) => {
    try {
      const confirmResponse = await lPointConfirm({
        token: session_token!,
        aprvMgNo: aprvMgNo
      }).unwrap();


      if (confirmResponse.code === 200) {
        await updateContentCoinBalance(); 
        await fetchLPointBalance(); 
        setIsSuccessPopupOpen(true);
      } else {
        console.log("Payment failed");
        setConfirmationMessage(decodeURIComponent(escape(`결제에 실패했습니다. 오류 코드: ${confirmResponse.code}, 메시지: ${confirmResponse.message}`)));
      }
    } catch (error) {
      console.error("Payment confirmation error:", error);
      setConfirmationMessage("결제 확인 중 오류가 발생했습니다.");
    }
  };

  const updateContentCoinBalance = async () => {
    try {
      const response = await fetch("/api/user/balance", {
        headers: {
          "Authorization": `Bearer ${session_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        dispatch(setBalance(data.balance));
        console.log("ContentCoin balance updated:", data.balance);
      } else {
        console.error("Failed to update ContentCoin balance:", data.message);
      }
    } catch (error) {
    }
  };

  const handleLPointPayment = useCallback(async () => {
    if (selectedProduct === null || !session_token) {
      setConfirmationMessage("결제 정보가 올바르지 않습니다.");
      return;
    }

    try {
      const selectedProductData = data[selectedProduct];
      const prepareResponse = await lPointPrepare({
        token: session_token,
        productId: selectedProduct,
        amount: selectedProductData.price,
        productName: `${selectedProductData.default_coin} ContentCoin`
      }).unwrap();


      if (prepareResponse.code === 200 && prepareResponse.data && prepareResponse.data.data) {
        const { aprvMgNo } = prepareResponse.data.data;
        
       
        const popup = window.open('', 'popup', 'width=445, height=750');
        
        if (popup && formRef.current) {
          formRef.current.deChnlDvC.value = "4"; 
          formRef.current.mcNo.value = "P112700002"; 
          formRef.current.aprvMgNo.value = aprvMgNo;
          formRef.current.srnDvC.value = "1"; 
          formRef.current.callbackFn.value = "receiveLpointMessage";
          formRef.current.returnUrl.value = "http://39.118.51.89:4493/vi/client/web-site/Lpoint/confirm";
          formRef.current.ssoTkn.value = ""; 
          formRef.current.rspDvC.value = "1"; 
          formRef.current.rspC.value = ""; 
          formRef.current.target = "popup";
          formRef.current.method = "post";
          formRef.current.action = "https://dev.lw.lpoint.com:2943/app/point/LWPT100200.do";
          formRef.current.submit();

  
          const checkPopupClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkPopupClosed);

              confirmLPointPayment(aprvMgNo);
            }
          }, 500);

        } else {
          throw new Error("팝업 창을 열 수 없습니다. 팝업 차단을 해제해주세요.");
        }
      } else {
        throw new Error(prepareResponse.message || "결제 준비에 실패했습니다.");
      }
    } catch (error) {

      if (error instanceof Error) {
        setConfirmationMessage(`L.POINT 결제 중 오류가 발생했습니다: ${error.message}`);
      } else {
        setConfirmationMessage("L.POINT 결제 중 알 수 없는 오류가 발생했습니다.");
      }
    }
  }, [selectedProduct, session_token, data, lPointPrepare, setConfirmationMessage, confirmLPointPayment]);

  const handlePaymentClick = async () => {
    if (selectedProduct === null) {
      setConfirmationMessage("결제 금액을 선택해주세요.");
      return;
    }
    
    if (!isAgreementChecked) {
      setConfirmationMessage("구매 진행에 동의해주세요.");
      return;
    }
    
    if (!session_token) {
      setConfirmationMessage("로그인이 필요합니다.");
      return;
    }


    if (isCardRegistered && lpointAvailablePoints !== null && lpointAvailablePoints >= data[selectedProduct].price) {
      await handleLPointPayment();
    } else {

      await requestPayment();
    }
  };

  const requestPayment = async () => {
    try {
      const res = await executePreparePayment(session_token, selectedProduct!);
      if (res.data.code === 200) {
        // @ts-ignore
        const paymentResponse = await tossPayments.current.requestPayment("카드", {
          cardCompany: "lpoint",
          amount: data[selectedProduct!].price,
          orderId: res.data.data.orderId,
          orderName: `${data[selectedProduct!].default_coin} ContentCoin`,
          customerName: userName,
          successUrl: `${window.location.origin}/payments/complete`,
          failUrl: `${window.location.origin}/payments/fail`,
        });

        const confirmResponse = await fetch("https://api-client.allcomics.org/v1/payment/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session_token}`,
          },
          body: JSON.stringify(paymentResponse),
        });

        if (!confirmResponse.ok) {
          throw new Error("Payment confirmation failed");
        }

        setIsSuccessPopupOpen(true);
      }
    } catch (error) {
      console.error("Payment request error:", error);
    }
  };

  const handleLpointBalanceCheck = async (cardNumber: string, balance: number) => {
    setIsCheckingBalance(true);
    try {
      setLpointBalance(balance);
      if (session_token) {
        const response = await getLPointBalance({ 
          token: session_token, 
          cardNumber: cardNumber
        }).unwrap();
        if (response.code === 200 && response.data && response.data.data) {
          setLpointAvailablePoints(response.data.data.avlPt);
          setIsCardRegistered(true);
        }
      } else {
        throw new Error("세션 토큰이 없습니다.");
      }
    } catch (error) {
      console.error('Error checking L.Point balance:', error);
      setLpointBalance(null);
      setLpointAvailablePoints(null);
    } finally {
      setIsCheckingBalance(false);
      setIsLpointFormOpen(false);
    }
  };

  return (
    <div>
      <Header />

      {confirmationMessage && <ConfirmPopup text={confirmationMessage} setText={setConfirmationMessage} />}

      <div className="w-full flex justify-center">
        <div className="max-w-[1200px] w-full flex flex-col items-center pt-16">
          <div className="flex items-center justify-between w-full px-4 mb-4">
            <div className="flex items-center text-lg">
              <span className="text-xl font-bold">ContentCoin 충전</span>
              <span className="ml-2">내 보유 포인트 ContentCoin&nbsp;</span>
              <span className="font-bold text-alco-mint">{balance!.toLocaleString("ko-KR")}</span>
              <span className="ml-10">L.Point</span> 
              <span className="font-bold text-alco-mint ml-3"> 
                {isCheckingBalance
                  ? "조회중"
                  : isCardRegistered
                    ? lpointAvailablePoints !== null
                      ? lpointAvailablePoints.toLocaleString("ko-KR")
                      : "조회 필요"
                    : "등록 필요"}
              </span>
            </div>

            {!isCardRegistered && (
              <button 
                onClick={() => setIsLpointFormOpen(true)} 
                className="open-popup-btn bg-alco-mint text-white py-2 px-3 rounded"
              >
                L.Point카드등록
              </button>
            )}
          </div>

          <div className="w-full h-[4px] bg-[#eeeeee]" />

          {isLpointFormOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-md shadow-lg">
                <LPointCardForm 
                  onClose={() => setIsLpointFormOpen(false)} 
                  onBalanceCheck={handleLpointBalanceCheck}
                />
              </div>
            </div>
          )}

          <div className="w-full h-[4px] bg-[#eeeeee]" />

          <div className="w-full px-4">
            <div className="text-base text-[#666666] mb-4">충전하실 금액을 선택해주세요.</div>
            {isLoading ? (
              <Loading height="h-[396px]" />
            ) : (
              data.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center p-4 border rounded-[8px] cursor-pointer ${
                    selectedProduct === index ? "border-alco-mint" : "border-[#eeeeee]"
                  }`}
                  onClick={() => setSelectedProduct(index)}
                >
                  <CircleC className="w-[24px] h-[24px] mr-4" />
                  <div className="font-bold flex-grow">
                    {item.default_coin} ContentCoin <span className="text-alco-mint">+{item.bonus_coin}</span>
                  </div>
                  <div className="min-w-[95px] bg-alco-mint text-white rounded-[16px] px-4 py-2">
                    ￦{item.price.toLocaleString("ko-KR")}
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedProduct !== null && (
            <div className="w-full px-4 my-4">
              <div className="text-base text-[#666666] mb-2">결제 금액을 인해주세요.</div>
              <div className="flex items-center">
                <img src="/logocolor.png" alt="logo" className="w-[64px] h-[48px]" />
                <div className="ml-4">
                  <div className="font-bold">{data[selectedProduct].default_coin} ContentCoin</div>
                  <div className="text-xl font-bold text-alco-mint">
                    ￦{data[selectedProduct].price.toLocaleString("ko-KR")}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="w-full px-4 mt-4">
            <div className="font-bold text-lg">결제 상품 이용안내</div>
            <ul className="text-sm text-[#666666] list-disc ml-4">
              <li>대여권, 소장권을 구매한 작품은 구 취소하거나 환불 받을 수 없습니다.</li>
              <li>결제에 대한 자세한 문의는 고객지원 페지에서 문의 해주시기 바랍니다.</li>
            </ul>

            <div
              className="flex items-center cursor-pointer mt-4"
              onClick={() => setIsAgreementChecked(!isAgreementChecked)}
            >
              <img
                src={isAgreementChecked ? "ico_check_on.png" : "ico_check_off.png"}
                alt="agreement checkbox"
                className="w-8 h-8 mr-2"
              />
              (필수) 위 내용을 확인하였으며 구매 진행에 동의합니다.
            </div>

            <button
              className="w-full bg-alco-mint text-white font-bold text-lg rounded-[8px] px-4 py-2 mt-4"
              onClick={handlePaymentClick}
            >
              결제요청
            </button>
          </div>
        </div>
      </div>

      {isLpointFormOpen && !isCardRegistered && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-lg">
            <LPointCardForm 
              onClose={() => setIsLpointFormOpen(false)} 
              onBalanceCheck={handleLpointBalanceCheck}
            />
          </div>
        </div>
      )}

      {isSuccessPopupOpen && <PaymentSuccessPopup isOpen={isSuccessPopupOpen} onClose={() => setIsSuccessPopupOpen(false)} />}


      <form ref={formRef} name="form1" style={{ display: 'none' }}>
        <input type="hidden" name="deChnlDvC" />
        <input type="hidden" name="mcNo" />
        <input type="hidden" name="aprvMgNo" />
        <input type="hidden" name="srnDvC" />
        <input type="hidden" name="callbackFn" />
        <input type="hidden" name="returnUrl" />
        <input type="hidden" name="ssoTkn" />
        <input type="hidden" name="rspDvC" />
        <input type="hidden" name="rspC" />
      </form>
    </div>
  );
};

export default Payments;