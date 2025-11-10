import { useRouter } from 'expo-router'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'

export default function Login() {
  const router = useRouter()
  return (
    <ScrollView>
      <View className="flex-1 justify-center items-center pt-32 px-6">
        <Text className="text-3xl font-semibold mb-6">Memory Sharing</Text>

        <TouchableOpacity
          className="bg-blue-600 p-3 w-60 mb-3 rounded-lg"
          onPress={() => {
            router.replace('/(tabs)/albums')
          }}
        >
          <Text className="text-white text-lg text-center">Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-300 p-3 w-60 rounded-lg"
          // onPress={() => router.push('/signup')}
        >
          <Text className="text-gray-800 text-lg text-center">
            Create account
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
