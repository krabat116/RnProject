import { View,Text } from "react-native";

export default function ErrorCard(props: {error?: string | undefined }) {
    const { error = 'Something went wrong. Please try again later' } = props;
    return (
      <View className='bg-transparent border-red-600 border-[1px] border-solid items-center justify-center p-3 rounded-lg my-4'>
        <Text className='text-red-600 text-base tracking-wider'>{error}</Text>
      </View>
    );
  }