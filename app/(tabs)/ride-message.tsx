import React, { useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

export default function RideMessageScreen() {
  const params = useLocalSearchParams();

  useEffect(() => {
    // Redirect to message_inbox with the same parameters
    router.replace({
      pathname: '/(tabs)/message_inbox',
      params: params,
    });
  }, [params]);

  // This component will immediately redirect, so we don't need to render anything
  return null;
}