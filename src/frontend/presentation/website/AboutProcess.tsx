import Icon from "@/frontend/presentation/shared/Icon";
import { processSteps } from "./data/process-steps";

const outcomes = [
  "Làm rõ mong muốn",
  "Hiểu đúng hiện trạng",
  "Chốt phương án phù hợp",
  "Sẵn sàng đưa vào sử dụng",
];

export default function AboutProcess() {
  return (
    <section className="about-process" aria-labelledby="about-process-title">
      <div className="container">
        <header className="about-process-header">
          <div>
            <span className="eyebrow about-process-eyebrow">
              CÁCH CÙNG NHAU BẮT ĐẦU
            </span>
            <h2 id="about-process-title">
              Rõ ràng qua <span>từng bước.</span>
            </h2>
          </div>
          <p>
            Từ ý tưởng ban đầu đến không gian hoàn thiện, mỗi bước là một lần
            cùng làm rõ lựa chọn cho ngôi nhà của bạn.
          </p>
        </header>

        <ol className="about-process-steps">
          {processSteps.map((step, index) => (
            <li key={step.number} className="about-process-step">
              <div className="about-process-step-top">
                <span className="about-process-number" aria-hidden="true">
                  {step.number}
                </span>
                <span className="about-process-icon">
                  <Icon name={step.icon} size={24} />
                </span>
              </div>
              <div className="about-process-track" aria-hidden="true">
                <span />
              </div>
              <div className="about-process-body">
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <div className="about-process-outcome">
                  <Icon name="check" size={14} />
                  <span>{outcomes[index]}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="about-process-note">
          <span className="about-process-note-mark" aria-hidden="true" />
          <p>
            Mỗi không gian có một nhu cầu riêng. Phương án được trao đổi theo
            hiện trạng thực tế của công trình.
          </p>
        </div>
      </div>
    </section>
  );
}
