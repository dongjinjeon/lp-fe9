import { Footer } from "@components/Footer";
import { Header } from "@components/Header";
import PaymentDetailPopup from "@components/Popup/PaymentDetail";
import { UserContext } from "@context/UserContext";
import { ReactComponent as ChevronLeftIcon } from "@svg/ChevronLeft.svg";
import { ReactComponent as ChevronRightIcon } from "@svg/ChevronRight.svg";
import { ReactComponent as CircleC } from "@svg/CircleC.svg";
import { useCallback, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSearchLPointPaymentsMutation } from '../../redux/services/payments';
import { Payment } from './paymentService';

export const Charged = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId, chargeLog, getChargeLog, chargeLogCnt, session_token } = useContext(UserContext);
  const [page, setPage] = useState<number>(1);
  const [data, setData] = useState<any>(chargeLog);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [lpointPayments, setLpointPayments] = useState<Payment[]>([]);
  const [lpointPage, setLpointPage] = useState<number>(1);
  const [lpointPageCount, setLpointPageCount] = useState<number>(1);

  const [searchLPointPayments] = useSearchLPointPaymentsMutation();

  useEffect(() => {
    if (chargeLogCnt === 0) {
      setPage(prev => prev - 1);
    } else {
      setData(chargeLog);
    }
  }, [chargeLog, chargeLogCnt]);

  useEffect(() => {
    if (userId === -1) {
      navigate("/login");
    }
  }, [userId]);

  useEffect(() => {
    fetchLpointPayments(lpointPage);
  }, [lpointPage]);

  const fetchLpointPayments = async (page: number) => {
    if (!session_token) {
      console.error('세션 토큰이 정의되지 않았습니다');
      return;
    }

    try {
      const result = await searchLPointPayments({
        token: session_token,
        startDate: '2023-01-01',
        endDate: '2024-12-31',
        page: page,
        count: 10,
      }).unwrap();

      if (result && result.data && result.data.list && result.data.list.length > 0) {
        setLpointPayments(result.data.list);
        setLpointPageCount(Math.ceil(result.data.total / 10));
      } else {
        console.error('L.POINT 결제 정보 가져오기 오류: 결제 정보 없음');
      }
    } catch (error) {
      console.error('L.POINT 결제 정보 가져오기 오류:', error);
    }
  };

  const clickNext = useCallback(() => {
    if (data.length >= 10) {
      setPage(page + 1);
    }
  }, [data, page]);

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setIsOpen(true);
  };

  return (
    <div className="">
      <div className="h-[10rem] max-lg:h-[6rem]">
        <Header />
      </div>
      <div className="flex flex-col">
        <div className="mx-auto max-w-[1200px] w-full px-[8rem] max-header:px-4">
          <div className="text-center mt-1 text-sm" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
            <div className="relative flex flex-row mb-8">
              <div className="flex flex-row leading-24 justify-center items-center">
                <p className="text-black font-bold text-2xl">충전내역</p>
              </div>
            </div>
            <div className="w-full" style={{ border: "1px solid #D0D0D0" }} />
            {data?.map((item: any, index: number) => (
              <Content
                key={index}
                item={item}
                onClick={() => handleItemClick(item)}
              />
            ))}
            {lpointPayments?.map((item: Payment, index: number) => (
              <Content
                key={`lpoint-${index}`}
                item={item}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>
          <div className="flex justify-center my-8 space-x-4">
            <div className="flex items-center space-x-2">
              <button
                className="bg-[#F7F7F7] px-2 py-2 rounded-[8px] border-[2px] border-solid font-notokr text-[16px] font-medium text-[#757575]"
                onClick={() => {
                  if (lpointPage > 1) setLpointPage(lpointPage - 1);
                }}
                disabled={lpointPage === 1}
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <span>{lpointPage} / {lpointPageCount}</span>
              <button
                className="bg-[#F7F7F7] px-2 py-2 rounded-[8px] border-[2px] border-solid font-notokr text-[16px] font-medium text-[#757575]"
                onClick={() => {
                  if (lpointPage < lpointPageCount) setLpointPage(lpointPage + 1);
                }}
                disabled={lpointPage === lpointPageCount}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="h-24" />
      </div>
      <Footer />
      {isOpen && (
        <PaymentDetailPopup
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          selectedItem={selectedItem}
        />
      )}
    </div>
  );
};

const Content = ({
  item,
  onClick,
}: {
  item: any;
  onClick: () => void;
}) => {
  return (
    <>
      <div className="flex flex-row items-center my-3 px-5 cursor-pointer" onClick={onClick}>
        <div className="flex mr-5">
          <CircleC />
        </div>
        <div className="flex flex-1 flex-row items-center justify-between max-sm:flex-col max-sm:items-start">
          <div className="flex items-center font-notokr text-left gap-4 max-sm:w-full">
            <span className="text-lg">{item.createdAt}</span>
            <span className="text-base">{item.default_coin + item.bonus_coin}Coin</span>
            <span className="text-black text-base font-medium">
              {item.amount}원
            </span>
          </div>
          <div className="flex items-center text-alco-mint text-xl max-sm:justify-start">
            {item.Status === 1 && <span className="text-green-500">결제완료</span>}
            {item.Status === 2 && <span className="text-red-500">취소완료</span>}
          </div>
        </div>
      </div>
      <div className="w-full" style={{ border: "1px solid #D0D0D0" }} />
    </>
  );
};
