import { UserContext } from '@context/UserContext';
import React, { useContext, useState } from "react";
import { useGetLPointBalanceMutation, useRegisterLPointCardMutation } from "../../redux/services/payments";
import "./styles.css";

interface LPointCardFormProps {
  onClose: () => void;
  onBalanceCheck: (cardNumber: string, balance: number) => Promise<void>;
}

const LPointCardForm: React.FC<LPointCardFormProps> = ({ onClose, onBalanceCheck }) => {
  const [cardNumber, setCardNumber] = useState<string>(""); 
  const [availablePoints, setAvailablePoints] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [getLPointBalance, { isLoading: isBalanceLoading }] = useGetLPointBalanceMutation();
  const [registerLPointCard] = useRegisterLPointCardMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const { session_token } = useContext(UserContext);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); 
    if (value.length > 16) return;

    const formattedValue = value
      .replace(/(\d{4})(?=\d)/g, "$1 ")
      .replace(/(\d{4})(\d{4})(\d{4})(\d{0,4})/, "$1 $2 $3 $4");

    setCardNumber(formattedValue);

    if (value.length === 16) {
      checkBalance(value);
    } else {
      setAvailablePoints(null);
      setError(null);
    }
  };

  const checkBalance = async (cardNum: string) => {
    if (!session_token) {
      console.error("세션 토큰이 없습니다.");
      setError("인증에 실패했습니다. 다시 로그인해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await getLPointBalance({ 
        token: session_token, 
        cardNumber: cardNum 
      }).unwrap();
      
      if (response.code === 200 && response.data) {
        const avlPtValue = response.data.data.avlPt;
        console.log("사용 가능한 L.Point:", avlPtValue);
        setAvailablePoints(avlPtValue);
        await onBalanceCheck(cardNum, avlPtValue);
      } else {
        throw new Error(response.message || "잔액 조회에 실패했습니다.");
      }
    } catch (error) {
      console.error("잔액 조회 실패:", error);
      setError("잔액 조회에 실패했습니다. 다시 시도해 주세요.");
      setAvailablePoints(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      setError("올바른 카드 번호를 입력해 주세요.");
      return;
    }
    await registerCard(cardNumber.replace(/\s/g, ''));
  };

  const registerCard = async (cardNum: string) => {
    if (!session_token) {
      console.error("세션 토큰이 없습니다.");
      setError("인증에 실패했습니다. 다시 로그인해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await registerLPointCard({
        token: session_token,
        cardNumber: cardNum
      }).unwrap();

      if (response.code === 200) {
        console.log("L.Point 카드 등록 성공");
        setIsRegistered(true);
        // 카드 등록 후 잔액 조회
        await checkBalance(cardNum);
      } else {
        console.error("카드 등록 실패:", response);
        setError("카드 등록에 실패했습니다. 다시 시도해 주세요.");
      }
    } catch (error) {
      console.error("카드 등록 오류:", error);
      setError("카드 등록 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container" style={{ width: '100%', maxWidth: '1200px', position: 'relative' }}> {/* position: 'relative' 추가 */}
      <button 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          fontSize: '64px',  // 24px에서 48px로 변경
          cursor: 'pointer',
          color: '#333',
          width: '64px',     // 버튼의 너비 추가
          height: '64px',    // 버튼의 높이 추가
          display: 'flex',   // Flexbox 사용
          alignItems: 'center',    // 세로 중앙 정렬
          justifyContent: 'center',  // 가로 중앙 정렬
          padding: '0',      // 패딩 제거
          lineHeight: '1',   // 줄 높이를 1로 설정하여 텍스트 정중앙에 위치
        }}
      >
        ×
      </button>
      <section className="ui" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="container-right" style={{ width: '100%', marginBottom: '18px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '1200px', aspectRatio: '3.2/1', margin: '0 auto' }}>
            <div className="intern" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div className="card-header">
                <div className="card-title" style={{ fontSize: '13px', fontWeight: 'bold' }}>Loving your Life</div>
                <div className="card-title" style={{ fontSize: '20.5px', fontWeight: 'bold' }}>L.POINT</div>
              </div>
              <div className="card-number" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div className="number-vl" style={{ fontSize: '20px', letterSpacing: '0.75px', textAlign: 'left' }}>
                  {cardNumber || "1234 5678 9101 1121"}
                </div>
                {isBalanceLoading ? (
                  <div style={{ fontSize: '16px', marginTop: '5px', color: '#4CAF50' }}>
                    사용 가능한 포인트: 조회 중...
                  </div>
                ) : availablePoints !== null ? (
                  <div style={{ fontSize: '16px', marginTop: '5px', color: '#4CAF50' }}>
                    사용 가능한 포인트: {availablePoints.toLocaleString()} 포인트
                  </div>
                ) : null}
              </div>
              <img className="chip" src="../chip.png" alt="chip" style={{ width: '37.5px', alignSelf: 'flex-start' }} />
            </div>
          </div>
        </div>

        <div className="container-left" style={{ width: '100%', maxWidth: '600px' }}>
          <form id="credit-card" onSubmit={handleSubmit}>
            <div className="number-container">
              <label htmlFor="card-number" style={{ fontSize: '13px' }}>카드 번호</label>
              <input
                type="text"
                name="card-number"
                id="card-number"
                maxLength={19}
                placeholder="1234 5678 9101 1121"
                value={cardNumber}
                onChange={handleCardNumberChange}
                required
                style={{ fontSize: '18px', padding: '7.5px', width: '100%', textAlign: 'center' }}
              />
            </div>

            <div className="infos-container" style={{ marginTop: '10.5px', fontSize: '12px', color: 'red' }}>
              {isSubmitting && <p>카등 등록중...</p>}
              {error && <p className="error">{error}</p>}
            </div>
            <input 
              type="submit" 
              value={isRegistered ? "카드 등록이 완료되었습니다" : (isSubmitting ? "등록 중..." : "L.Point 카드 등록")} 
              id="add" 
              disabled={isSubmitting || isRegistered}
              style={{
                fontSize: '15px',
                padding: '10px 15px',
                marginTop: '15px',
                width: '100%',
                backgroundColor: '#009cfc',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease',
                background: 'linear-gradient(145deg, #008ce3, #009cfc)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = '#4CAF50'; // 무료충전소 버튼과 유사한 녹색으로 변경
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'linear-gradient(145deg, #008ce3, #009cfc)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.background = '#45a049'; // 클릭 시 약간 어두운 녹색
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.background = '#4CAF50'; // 클릭 후 다시 버 색상으로
              }}
            />
          </form>
        </div>
      </section>
    </main>
  );
};

export default LPointCardForm;