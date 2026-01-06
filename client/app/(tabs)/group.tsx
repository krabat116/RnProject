import {
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  Pressable,
  TouchableHighlight,
  StyleSheet,
  TextInput,
} from 'react-native'
import type { FC } from 'react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFonts, Italiana_400Regular } from '@expo-google-fonts/italiana'
import { Link, useLocalSearchParams } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '@/external/fetch'
import Ionicons from '@expo/vector-icons/Ionicons'
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import Button, { DestructiveButton } from '@/components/CustomButton'
import ErrorCard from '@/components/ErrorCard'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import { useUserSession } from '@/components/contexts/sessionContext'

type Group = {
  description: string
  name: string
  dateCreated: string
  id: string
  lastUpdated: string
  owner: string
  emojiThumbnail: string
  members: string[]
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Italiana_400Regular,
  })

  const [groupData, setGroupData] = useState<Group[] | undefined>(undefined)
  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>(
    undefined
  )
  const { userId } = useUserSession()

  const fetchGroups = async () => {
    if (!userId) return // ✅ 이 한 줄 추가

    const { data, error, response } = await api.GET('/group/all/{userId}', {
      params: { path: { userId } }, // ✅ userId || '' 제거
    })

    if (error) {
      console.log('GROUP fetch failed:', response?.status, error)
      setGroupData([])
      return
    }

    setGroupData(data?.groups ?? [])
  }

  useEffect(() => {
    fetchGroups()
  }, [userId])

  //#region ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const actionsModalRef = useRef<BottomSheetModal>(null)
  //#endregion

  //#region hooks
  const { bottom: bottomSafeArea } = useSafeAreaInsets()
  const snapPoints = useMemo(() => ['80%'], [])
  //#endregion

  //#region callbacks
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present()
  }, [])

  const createActionsModal = useCallback(() => {
    actionsModalRef.current?.present()
  }, [])
  //#endregion

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
    },
    contentContainer: {
      flex: 1,
      padding: 18,
      minHeight: 200,
    },
  })

  //#region styles
  const contentContainerStyle = useMemo(
    () => ({
      ...styles.contentContainer,
      paddingBottom: bottomSafeArea,
    }),
    [bottomSafeArea]
  )
  //#endregion

  const ProfileGrid: FC<{ members: string[] }> = ({ members }) => {
    return (
      <View className="w-full h-full flex flex-row flex-wrap">
        {members.slice(0, 4).map((member, index) => (
          <View key={index} className="w-1/2 h-1/2 p-0.5">
            <Image
              className="w-full h-full rounded-full"
              source={{ uri: member }}
            />
          </View>
        ))}
      </View>
    )
  }

  // Component to render each group in the FlatList
  const GroupItem: FC<{ group: Group }> = ({ group }) => {
    const callback = () => {
      setSelectedGroup(group)
      createActionsModal()
    }
    const gesture = Gesture.LongPress().onStart(callback)
    return (
      <GestureDetector gesture={gesture}>
        <View className="mb-6 w-1/2">
          <Link
            href={{
              pathname: '/(routes)/group-detail/[groupId]',
              params: { groupId: group.id },
            }}
            asChild
          >
            <TouchableOpacity>
              <View className="w-full aspect-square p-2">
                <ProfileGrid members={group.members} />
              </View>

              <Text className="text-left text-xl flex-wrap font-thin ml-2 mt-1">
                {group.name}
              </Text>
              <Text className="text-xs text-gray-400 ml-2">
                {group.members.length}{' '}
                {group.members.length == 1 ? 'member' : 'members'}
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </GestureDetector>
    )
  }

  const GroupList = () => {
    return (
      <FlatList
        data={groupData}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <GroupItem key={item.id} group={item} />}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    )
  }

  const AddAlbumButton = () => {
    return (
      <TouchableHighlight
        className="justify-center rounded-full aspect-square align-middle"
        activeOpacity={0.1}
        underlayColor="#DDDDDD"
        onPress={handlePresentModalPress}
      >
        <Ionicons name="add-outline" size={40} />
      </TouchableHighlight>
    )
  }

  const GroupActions = () => {
    const [isError, setIsError] = useState(false)

    const deleteSelectedGroup = async () => {
      const { data, error } = await api.DELETE('/group/{groupId}', {
        params: { path: { groupId: selectedGroup?.id || '' } },
      })

      if (error) setIsError(true)
      actionsModalRef.current?.dismiss()
      fetchGroups()
    }

    const leaveSelectedGroup = async () => {
      const { data, error } = await api.DELETE(
        '/groupmember/{groupId}/{userId}',
        {
          params: {
            path: {
              groupId: selectedGroup?.id || '',
              userId: userId || '',
            },
          },
        }
      )

      if (error) setIsError(true)
      actionsModalRef.current?.dismiss()
      fetchGroups()
    }

    const isOwner = selectedGroup?.owner == userId

    return (
      <View>
        {isOwner && (
          <DestructiveButton
            title="Delete Group"
            onPress={deleteSelectedGroup}
          ></DestructiveButton>
        )}
        {!isOwner && (
          <DestructiveButton
            title="Leave Group"
            onPress={leaveSelectedGroup}
          ></DestructiveButton>
        )}
        {isError && <ErrorCard />}
      </View>
    )
  }

  const CreateGroupForm = () => {
    const [newGroupName, setNewGroupName] = useState<string>('')
    const [newGroupDesc, setNewGroupDesc] = useState<string>('')
    const [isError, setIsError] = useState(false)

    async function createNewGroup() {
      if (newGroupName.trim() == '' || newGroupDesc.trim() == '') {
        setIsError(true)
        return
      }
      //Note: biggest issue here could be ownerid being null somehow
      setIsError(false)
      const { data, error } = await api.POST('/group', {
        body: {
          ownerId: userId || '',
          name: newGroupName.trim(),
          description: newGroupDesc.trim(),
          emojiThumbnail: '🛸', // Nothing placeholder emoji
        },
      })

      if (error) {
        setIsError(true)
      }

      //Sucessful create
      bottomSheetModalRef.current?.dismiss()
      fetchGroups()
    }

    return (
      <>
        <TextInput
          style={{ fontFamily: 'Nunito_400Regular' }}
          className="bg-white border-gray-200 border-solid border-2 p-4 mb-4 rounded-lg w-full"
          placeholder="Name"
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
          value={newGroupName}
          onChangeText={(value: string) => setNewGroupName(value)}
        ></TextInput>

        <TextInput
          style={{ fontFamily: 'Nunito_400Regular' }}
          className="bg-white border-gray-200 border-solid border-2 p-4 mb-4 rounded-lg w-full"
          placeholder="Description"
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
          value={newGroupDesc}
          onChangeText={(value: string) => setNewGroupDesc(value)}
        ></TextInput>

        <Button title="Create" onPress={createNewGroup}></Button>
        {isError && <ErrorCard />}

        <></>
      </>
    )
  }

  return (
    <SafeAreaView className="flex-1 p-4 bg-white">
      <View className="flex-1 p-4 bg-white">
        <View className="flex flex-row mb-6">
          <Text
            className="flex-grow text-4xl tracking-wider"
            style={{ fontFamily: 'Italiana_400Regular' }}
          >
            Groups
          </Text>
          <AddAlbumButton />
        </View>
        <GroupList />
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          snapPoints={snapPoints}
          style={{ shadowRadius: 6, shadowColor: '#000', shadowOpacity: 0.15 }}
        >
          <BottomSheetView style={contentContainerStyle}>
            <Text
              className="mb-8 text-4xl font-bold tracking-wider"
              style={{ fontFamily: 'Italiana_400Regular' }}
            >
              Create Group
            </Text>
            <CreateGroupForm />
          </BottomSheetView>
        </BottomSheetModal>

        {/* Actions modal */}
        <BottomSheetModal
          ref={actionsModalRef}
          index={0}
          snapPoints={['50%']}
          style={{ shadowRadius: 6, shadowColor: '#000', shadowOpacity: 0.15 }}
        >
          <BottomSheetView style={contentContainerStyle}>
            <Text
              className="mb-8 text-4xl font-bold tracking-wider"
              style={{ fontFamily: 'Italiana_400Regular' }}
            >
              {selectedGroup?.name}
            </Text>
            <GroupActions />
          </BottomSheetView>
        </BottomSheetModal>
      </View>
    </SafeAreaView>
  )
}
