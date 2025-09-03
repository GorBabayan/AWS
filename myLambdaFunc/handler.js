import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {
    CognitoIdentityProviderClient,
    SignUpCommand,
    InitiateAuthCommand,
    ConfirmSignUpCommand
} from "@aws-sdk/client-cognito-identity-provider";


const client = new CognitoIdentityProviderClient({ region: "us-east-1" });
const dynamodbClient = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(dynamodbClient);

export const signUp = async (event) => {
    const { email, password, firstName, lastName, role, language, nationality } = JSON.parse(event.body);

    try {
        const command = new SignUpCommand({
            ClientId: process.env.CLIENT_ID,
            Username: email,
            Password: password,
            UserAttributes: [{ Name: "email", Value: email }],
        });

        const response = await client.send(command);

        const putCommand = new PutCommand({
            TableName: process.env.USERS_TABLE,
            Item: {
                email,
                firstName,
                lastName,
                role: "user",
                language: language || "en",
                nationality: nationality || "unknown",
            }
        });

        await docClient.send(putCommand);

        return {
            statusCode: 200, 
            body: JSON.stringify({ message: "User registered", response }),
        }
    } catch(err) {
        console.error("Sign up error: ", err);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: err.message }),
        } 
    }
}

export const confirmSignUp = async (event) => {
    const { email, code } = JSON.parse(event.body);

    try {
        const command = new ConfirmSignUpCommand({
            ClientId: process.env.CLIENT_ID,
            Username: email,
            ConfirmationCode: code,
        });

        const response = await client.send(command);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "User confirmed", response }),
        }
    } catch(err) {
         return {
            statusCode: 400,
            body: JSON.stringify({ error: err.message }),
        }
    }
}

export const login = async (event) => {
    const { email, password } = JSON.parse(event.body);

    try {
        const command = new InitiateAuthCommand({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: process.env.CLIENT_ID,
            AuthParameters: { USERNAME: email, PASSWORD: password },
        });

        const response = await client.send(command);

        const getUserCommand = new GetCommand({
            TableName: process.env.USERS_TABLE,
            Key: { email: email },
        });

        const userResult = await docClient.send(getUserCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: "Login successful", 
                tokens: response.AuthenticationResult,
                user: userResult.Item || {},
            }),
        };
    } catch(err) {
        console.error("Login error: ", err);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: err.message }),
        };
    }
}