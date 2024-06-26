# Automation-of-emails-reply-and-modify-labels-using-openai
This project provides a backend server that automates the process of replying to client emails and adding labels based on the email's content. By sending the email subject and a snippet of the content to the OpenAI API, the server receives a response and takes the appropriate actions.BullMq scheduler run in every 10 second and fectch any new mail presnet or not if presnt then call the for the worker and queue to perform their jobs.

## Features
Automated Email Replies: The server uses OpenAI's API to generate responses to client emails.
//
Labeling Emails: Based on the content, emails are labeled as "Interested," "Not Interested," or "More Info."
//
Scheduler BullMQ: Help to schedule the jobs on every 10 second of intervals detect the new mail present in gmail and fetch the data then send it to the openai to do t works and then labbel the email accordingly. 
