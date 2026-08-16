import "./styles/About.css";
import { config } from "../config";

const About = () => {
  const paragraphs = config.about.description.split("\n\n");

  return (
    <div className="about-section" id="about">
      <div className="about-me">
        <h3 className="title">{config.about.title}</h3>
        {paragraphs.map((paragraph, index) => (
          <p className="para" key={index} style={{ marginBottom: index < paragraphs.length - 1 ? "1.2rem" : 0 }}>
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
};

export default About;
