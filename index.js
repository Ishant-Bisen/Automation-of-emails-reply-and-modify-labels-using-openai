const { getEmails, authorize ,addLabels} = require("./email");
const OpenAIApi = require("openai");
const getlabel = require("./openai")
const openai = new OpenAIApi({apiKey: "sk-proj-V0k3wJXgR4XCy2mhShKCT3BlbkFJef5NeakJhfA8COU1l6Wf", dangerouslyAllowBrowser: true});
// const {cron_job} = require("./cron_job")

const getAuthData = async () => {
    try {
      return await authorize();
    } catch (error) {
      console.error("Error during authorization:", error);
      throw error;
    }
};
const getEmailContent = async (authData) => {
  try {
    return await getEmails(authData);
  } catch (error) {
    console.error("Error fetching email content:", error);
    throw error;
  }
};
  
async function main() {
    try {
      const authData = await getAuthData();
      const emailContentData = await getEmailContent(authData);
    //   console.log(emailContentData);
      for(const email of emailContentData){
        // console.log(email);
        //   const labeledEmail = await getlabel(email.snippet,openai);
        const addLabel = await addLabels(authData, email.id , "Intrested")
          console.log(addLabel);
  
      }
    } catch (error) {
      console.error("Error in main function:", error);
    }
  }
  
main();

