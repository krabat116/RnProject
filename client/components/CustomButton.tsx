import { Pressable,Text, TouchableHighlight } from "react-native";

export default function Button(props: { onPress: any; title?: string | undefined }) {
    const { onPress, title = 'Save' } = props;
    return (
      <Pressable className='bg-black items-center justify-center py-3 rounded-lg' 
      onPress={onPress}>
        <Text className='font-bold text-stone-50 text-lg tracking-wider'>{title}</Text>
      </Pressable>
    );
  }

  export function DestructiveButton(props: { onPress: any; title?: string | undefined }) {
    const { onPress, title = 'Delete' } = props;
    return (
      <Pressable className='bg-red-500 items-center justify-center py-3 rounded-lg' 
      onPress={onPress}>
        <Text className='font-bold text-stone-50 text-lg tracking-wider'>{title}</Text>
      </Pressable>
    );
  }