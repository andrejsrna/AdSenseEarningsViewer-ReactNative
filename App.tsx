import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { Card, Icon, Divider, Button, Text } from '@rneui/themed';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import { IOS_CLIENT_ID, WEB_CLIENT_ID } from '@env'; // Import environment variables

GoogleSignin.configure({
  iosClientId: IOS_CLIENT_ID,
  webClientId: WEB_CLIENT_ID,
  scopes: ['https://www.googleapis.com/auth/adsense.readonly'],
});


interface AdsenseAccount {
  name: string; // e.g., 'accounts/pub-1234567890'
  displayName: string;
  // Other properties...
}

interface AdsenseReportRow {
  dimensionValues?: { [key: string]: any };
  metricValues: { [key: string]: { value: string } };
}

interface AdsenseReport {
  rows: AdsenseReportRow[];
  // Other properties...
}

interface AdsenseData {
  earningsThisMonth: number;
  earningsLastMonth: number;
  earningsLast7Days: { date: string; earnings: number }[];
  percentageChange: number;
  currencyCode: string;
}


const App = () => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [adsenseData, setAdsenseData] = useState<AdsenseData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Moved inside the component

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const user = await GoogleSignin.signIn();
      setUserInfo(user);
      // Fetch data after successful sign-in
      fetchAndSetData();
    } catch (error) {
      console.error('Error during sign-in:', error);
      setErrorMessage('Error during sign-in. Please try again.');
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      setUserInfo(null);
      setAdsenseData(null);
      setErrorMessage(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const tokens = await GoogleSignin.getTokens();
      return tokens.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      setErrorMessage('Error getting access token. Please try again.');
      return null;
    }
  };

  const fetchAdsenseData = async (): Promise<AdsenseData | null> => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        console.error('No access token available');
        setErrorMessage('Authentication failed. Please try signing in again.');
        return null;
      }
  
      // Get the list of AdSense accounts
      const accountsResponse = await axios.get(
        'https://adsense.googleapis.com/v2/accounts',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
  
      const accounts = accountsResponse.data.accounts as AdsenseAccount[];
      if (!accounts || accounts.length === 0) {
        console.error('No AdSense accounts found for this user.');
        setErrorMessage('No AdSense accounts found for this user.');
        return null;
      }
  
      const accountId = accounts[0].name; // e.g., 'accounts/pub-1234567890'
  
      // Get earnings for the current month
      const today = new Date();
  
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const currentMonthEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
      // Get earnings for the last month
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0); // Last day of last month
  
      // Prepare date ranges for API calls
      const dateRanges = {
        thisMonth: {
          startDate: currentMonthStart,
          endDate: currentMonthEnd,
        },
        lastMonth: {
          startDate: lastMonthStart,
          endDate: lastMonthEnd,
        },
        last7Days: [], // Will hold dates for last 7 days
      };
  
      // Calculate dates for last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dateRanges.last7Days.push(date);
      }
  
      // Function to format dates for API
      const formatDateForApi = (date: Date) => ({
        'year': date.getFullYear(),
        'month': date.getMonth() + 1,
        'day': date.getDate(),
      });
  
      // Function to fetch earnings for a date range
      const fetchEarnings = async (startDate: Date, endDate: Date) => {
        const response = await axios.get<AdsenseReport>(
          `https://adsense.googleapis.com/v2/${accountId}/reports:generate`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              metrics: 'ESTIMATED_EARNINGS',
              'startDate.year': startDate.getFullYear(),
              'startDate.month': startDate.getMonth() + 1,
              'startDate.day': startDate.getDate(),
              'endDate.year': endDate.getFullYear(),
              'endDate.month': endDate.getMonth() + 1,
              'endDate.day': endDate.getDate(),
            },
          }
        );
  
        const data = response.data;
  
        if (data.rows && data.rows.length > 0) {
          const earningsIndex = data.headers.findIndex(
            (header) => header.name === 'ESTIMATED_EARNINGS'
          );
  
          if (earningsIndex === -1) {
            throw new Error('ESTIMATED_EARNINGS metric not found in headers.');
          }
  
          const earningsValue = data.rows[0].cells[earningsIndex].value;
          const earnings = parseFloat(earningsValue);
  
          const currencyCode = data.headers[earningsIndex].currencyCode || 'USD';
  
          return { earnings, currencyCode };
        } else {
          return { earnings: 0, currencyCode: 'USD' };
        }
      };
  
      // Fetch earnings for the current month
      const { earnings: earningsThisMonth, currencyCode } = await fetchEarnings(
        dateRanges.thisMonth.startDate,
        dateRanges.thisMonth.endDate
      );
  
      // Fetch earnings for the last month
      const { earnings: earningsLastMonth } = await fetchEarnings(
        dateRanges.lastMonth.startDate,
        dateRanges.lastMonth.endDate
      );
  
      // Calculate percentage change
      const percentageChange =
        earningsLastMonth > 0
          ? ((earningsThisMonth - earningsLastMonth) / earningsLastMonth) * 100
          : 0;
  
      // Fetch earnings for the last 7 days
      const earningsLast7Days: { date: string; earnings: number }[] = [];
  
      for (const date of dateRanges.last7Days) {
        const { earnings } = await fetchEarnings(date, date);
        earningsLast7Days.push({
          date: date.toISOString().split('T')[0], // Format as 'YYYY-MM-DD'
          earnings,
        });
      }
  
      return {
        earningsThisMonth,
        earningsLastMonth,
        earningsLast7Days,
        percentageChange,
        currencyCode,
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error(
          'API Error:',
          error.response?.status,
          JSON.stringify(error.response?.data, null, 2)
        );
        const apiErrorMessage =
          error.response?.data?.error?.message ||
          'An error occurred while fetching AdSense data.';
        setErrorMessage(apiErrorMessage);
      } else if (error instanceof Error) {
        console.error('Error fetching AdSense data:', error.message);
        setErrorMessage(error.message);
      } else {
        console.error('An unexpected error occurred:', error);
        setErrorMessage(
          'An unexpected error occurred while fetching AdSense data.'
        );
      }
      return null;
    }
  };  


  const fetchAndSetData = async () => {
    setLoading(true);
    setErrorMessage(null); // Clear previous error messages
    const data = await fetchAdsenseData();
    setAdsenseData(data);
    setLoading(false);
  };

  return (
    <ScrollView style={{ padding: 20 }}>
    {!userInfo ? (
      <View style={{ alignItems: 'center', marginTop: 50 }}>
        <Text h2 style={{ textAlign: 'center', marginBottom: 20 }}>
          Welcome to AdSense Stats App
        </Text>
        <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 40 }}>
          Easily track your AdSense earnings and performance data with our app.
          Sign in to get started!
        </Text>
        <Button title="Sign In with Google" onPress={signIn} />
      </View>
      ) : loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 }}>
    <ActivityIndicator size="large" color="#0000ff" />
    <Text style={{ marginTop: 10 }}>Loading AdSense data...</Text>
  </View>
      ) : errorMessage ? (
        <View>
          <Text style={{ color: 'red' }}>{errorMessage}</Text>
          <Button title="Retry" onPress={fetchAndSetData} />
          <Button title="Sign Out" onPress={signOut} />
        </View>
      ) : adsenseData ? (
        <View>
          {/* Earnings This Month */}
          <Card>
            <Card.Title>This Month's Earnings</Card.Title>
            <Card.Divider />
            <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
              {adsenseData.currencyCode} {adsenseData.earningsThisMonth.toFixed(2)}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Icon
                name={adsenseData.percentageChange >= 0 ? 'arrow-upward' : 'arrow-downward'}
                color={adsenseData.percentageChange >= 0 ? 'green' : 'red'}
              />
              <Text
                style={{
                  color: adsenseData.percentageChange >= 0 ? 'green' : 'red',
                  fontSize: 16,
                }}
              >
                {Math.abs(adsenseData.percentageChange).toFixed(2)}%
              </Text>
            </View>
          </Card>
  
          {/* Earnings Last Month */}
          <Card>
            <Card.Title>Last Month's Earnings</Card.Title>
            <Card.Divider />
            <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
              {adsenseData.currencyCode} {adsenseData.earningsLastMonth.toFixed(2)}
            </Text>
          </Card>
  
          {/* Earnings Last 7 Days */}
          <Card>
            <Card.Title>Last 7 Days Earnings</Card.Title>
            <Card.Divider />
            {adsenseData.earningsLast7Days.map((item, index) => (
              <View
                key={index}
                style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 }}
              >
                <Text>{item.date}</Text>
                <Text>
                  {adsenseData.currencyCode} {item.earnings.toFixed(2)}
                </Text>
              </View>
            ))}
          </Card>
          <Button
      title="Refresh Data"
      onPress={fetchAndSetData}
      containerStyle={{ marginBottom: 20, marginTop: 20 }}
    />
          <Button title="Sign Out" onPress={signOut} />
        </View>
      ) : (
        <View>
          <Text>No AdSense data available.</Text>
          <Button title="Sign Out" onPress={signOut} />
        </View>
      )}
    </ScrollView>
  );
}  

export default App;
