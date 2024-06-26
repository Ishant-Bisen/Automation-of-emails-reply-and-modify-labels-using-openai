
const labelEmail = async (emailContent, openai, retries = 3) => {
    try {
    console.log(emailContent);
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5',
        messages: [
          { role: "system", content: "You are an assistant that labels emails as 'interested', 'not interested', or 'more info'." },
        ],
      });
      return completion.choices[0];
    } catch (error) {
      if (error.code === 'insufficient_quota' && retries > 0) {
        console.warn(`Quota exceeded. Retrying... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 3 seconds before retrying
        return labelEmail(emailContent,openai, retries - 1);
      } else {
        console.error("Error creating completion:", error);
        throw error;
      }
    }
  };

module.exports = labelEmail;
