import React, {
  useState,
  useEffect,
  FC,
  useRef,
  useCallback,
  useMemo,
} from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TouchableHighlight,
  StyleSheet,
  TextInput,
} from 'react-native'
import { Link, useLocalSearchParams } from 'expo-router'
import { useFonts, Italiana_400Regular } from '@expo-google-fonts/italiana'
import { api } from '@/external/fetch'
import { Group, GroupAlbums, Album, AlbumNoImages } from '@/app/@types/common'
import Ionicons from '@expo/vector-icons/Ionicons'
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Button, { DestructiveButton } from '@/components/CustomButton'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import ErrorCard from '@/components/ErrorCard'
import { useUserSession } from '@/components/contexts/sessionContext'

type RawMember = {
  dateAdded: string
  GroupId: string
  Role: string
  userId: string
}

type Member = RawMember & {
  firstName: string
  lastName: string
  profileImage: string
}

const GroupDetail = () => {
  const [fontsLoaded] = useFonts({ Italiana_400Regular })
  const { groupId } = useLocalSearchParams()
  const groupIdString = Array.isArray(groupId) ? groupId[0] : groupId

  const [groupData, setGroupData] = useState<Group | undefined>(undefined)
  const [groupAlbums, setGroupAlbums] = useState<GroupAlbums>([])
  const [selectedAlbum, setSelectedAlbum] = useState<Album | undefined>(
    undefined
  )

  const { userId } = useUserSession()

  const { bottom: bottomSafeArea } = useSafeAreaInsets()
  const groupAlbumOptionsModalRef = useRef<BottomSheetModal>(null)
  const addAlbumModalRef = useRef<BottomSheetModal>(null)
  const membersModalRef = useRef<BottomSheetModal>(null)

  const createAlbumOptionsModal = useCallback(() => {
    groupAlbumOptionsModalRef.current?.present()
  }, [])

  const createAddAlbumModal = useCallback(() => {
    addAlbumModalRef.current?.present()
  }, [])

  const createMembersModal = useCallback(() => {
    membersModalRef.current?.present()
  }, [])

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

  const fetchImages = async (albumId: string) => {
    try {
      const { data, error } = await api.GET('/image/all/{albumId}', {
        params: { path: { albumId } },
      })

      console.log(data)

      if (error) {
        return []
      }

      return (data || []).slice(0, 4).map((image: any) => ({
        id: image.id,
        url: image.imageUrl,
      }))
    } catch (err) {
      return []
    }
  }

  const fetchGroupAlbums = async () => {
    const { data, error } = await api.GET('/group/albums/{groupId}', {
      params: {
        path: {
          groupId: groupIdString,
        },
      },
    })

    if (error) throw new Error('Unable to Fetch Group Albums')
    if (!data.albums) return

    const albumsWithImages = await Promise.all(
      data.albums.map(async (album) => {
        return {
          ...album,
          images: await fetchImages(album.id),
          numImages: !album.numImages ? 0 : album.numImages,
        }
      })
    )

    setGroupAlbums(albumsWithImages)
  }

  const fetchGroup = async () => {
    const { data, error } = await api.GET('/group/{groupId}', {
      params: {
        path: {
          groupId: groupIdString,
        },
      },
    })

    if (error) throw new Error('Unable to Fetch Group')
    if (!data.group) return

    setGroupData(data.group)
  }

  useEffect(() => {
    fetchGroup()
    fetchGroupAlbums()
  }, [groupIdString])

  if (!groupData) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading album details...</Text>
      </View>
    )
  }

  if (!groupData) {
    return (
      <View>
        <Text>Group not found</Text>
      </View>
    )
  }

  const ThumbnailGrid: FC<{ images: { id: string; url: string }[] }> = ({
    images,
  }) => {
    return (
      <View className="w-full h-full flex flex-row flex-wrap">
        {images.slice(0, 4).map((image, index) => (
          <View key={index} className="w-1/2 h-1/2 p-0.5">
            <Image
              className="w-full h-full rounded-md"
              source={{ uri: image.url }}
              resizeMode="cover"
            />
          </View>
        ))}
      </View>
    )
  }

  const AlbumComponent: FC<{ album: Album }> = ({ album }) => {
    const callback = () => {
      setSelectedAlbum(album)
      createAlbumOptionsModal()
    }
    const gesture = Gesture.LongPress().onStart(callback)

    return (
      <GestureDetector gesture={gesture}>
        <View className="mb-6 w-1/2">
          <Link
            href={{
              pathname: '/(routes)/albums/[albumId]',
              params: { albumId: album.id },
            }}
            asChild
          >
            <TouchableOpacity>
              <View className="w-full aspect-square p-2">
                <ThumbnailGrid images={album.images} />
              </View>

              <Text className="text-left text-xl flex-wrap font-thin ml-2 mt-1">
                {album.name || 'Album Name'}
              </Text>
              <Text className="text-xs text-gray-400 ml-2">
                {`${album.numImages || 0} photos`}
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </GestureDetector>
    )
  }

  const AlbumList = () => {
    return (
      <FlatList
        data={groupAlbums}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AlbumComponent key={item.id} album={item} />}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    )
  }

  const AlbumListItem: FC<{
    album: AlbumNoImages
    selectedValues: string[]
    setter: React.Dispatch<React.SetStateAction<string[]>>
  }> = ({ album, selectedValues, setter }) => {
    const [selected, setSelected] = useState(false)

    const select = () => {
      setSelected(true)
      setter([...selectedValues, album.id])
    }

    const deselect = () => {
      setSelected(false)
      setter([...selectedValues.filter((v) => v != album.id)])
    }

    if (!selected) {
      return (
        <TouchableOpacity onPress={select}>
          <View className="p-5 border-solid border-[1.5px] border-black rounded-lg my-1">
            <Text className="text-lg self-center">{album.name}</Text>
          </View>
        </TouchableOpacity>
      )
    } else {
      return (
        <TouchableOpacity onPress={deselect}>
          <View className="p-5  border-solid border-[1.5px] border-black bg-black rounded-lg my-1">
            <Text className=" text-white text-lg self-center">
              {album.name}
            </Text>
          </View>
        </TouchableOpacity>
      )
    }
  }

  const AddAlbumForm = () => {
    const [userOwnedAlbums, setUserOwnedAlbums] = useState<AlbumNoImages[]>([])
    const [isError, setIsError] = useState(false)
    const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>([])

    const fetchUserAlbums = async () => {
      const { data, error } = await api.GET('/album/all/{userId}', {
        params: {
          path: {
            userId: userId || '',
          },
        },
      })

      if (error) setIsError(true)

      //TODO: Filter out albums which are already added.
      const filteredAlbumIds =
        data?.albumIds.filter(
          (id) => groupAlbums.find((val) => val.id == id) == undefined
        ) || []

      const fetchedAlbums = await Promise.all(
        filteredAlbumIds.map(async (albumId) => {
          return await api.GET('/album/{albumId}', {
            params: { path: { albumId: albumId } },
          })
        })
      )

      // const albums = fetchedAlbums
      //   .filter((album) => album.data != undefined)
      //   .map((album) => album.data.album)
      // setUserOwnedAlbums(albums)
      const albums = fetchedAlbums.flatMap((res) =>
        res.data ? [res.data.album] : []
      )

      setUserOwnedAlbums(albums)
    }

    const addAlbumsToGroup = async () => {
      await Promise.all(
        selectedAlbumIds.map(async (albumId) => {
          const { data, error } = await api.POST('/group/{groupId}/{albumId}', {
            params: {
              path: {
                albumId: albumId,
                groupId: groupIdString,
              },
            },
          })

          if (error) setIsError(true)
        })
      )

      addAlbumModalRef.current?.dismiss() //TODO: see it this still works upon repeated usages.

      fetchGroupAlbums()
      fetchUserAlbums()
    }

    useEffect(() => {
      fetchUserAlbums()
    }, [groupIdString])

    useEffect(() => {}, [selectedAlbumIds])

    return (
      <>
        <FlatList
          data={userOwnedAlbums}
          numColumns={1}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlbumListItem
              album={item}
              selectedValues={selectedAlbumIds}
              setter={setSelectedAlbumIds}
            />
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
        <Button title="Add Album(s) to Group" onPress={addAlbumsToGroup} />
      </>
    )
  }

  const GroupAlbumActions = () => {
    const [isError, setIsError] = useState(false)

    const removeSelectedAlbum = async () => {
      const { data, error } = await api.DELETE('/group/{groupId}/{albumId}', {
        params: {
          path: {
            albumId: selectedAlbum?.id || '',
            groupId: groupIdString,
          },
        },
      })

      if (error) setIsError(true)
      groupAlbumOptionsModalRef.current?.dismiss()
      // fetchAlbums();
      fetchGroupAlbums()
    }

    return (
      <View>
        <DestructiveButton
          title="Remove Album from Group"
          onPress={removeSelectedAlbum}
        ></DestructiveButton>
        {isError && <ErrorCard />}
      </View>
    )
  }

  const MemberCard: FC<{ member: Member }> = ({ member }) => {
    return (
      <View className="flex flex-row w-full p-2 border-solid border-[1.5px] border-black rounded-lg my-1">
        <View key={member.userId} className="">
          <Image
            className="h-16 w-16 aspect-square rounded-full"
            source={{ uri: member.profileImage }}
          />
        </View>
        <Text className=" ml-4 text-xl  self-center">
          {member.firstName} {member.lastName}
        </Text>
      </View>
    )
  }

  const GroupMembers = () => {
    const [isError, setIsError] = useState(false)
    const [members, setMembers] = useState<Member[]>([])
    const [phoneNum, setPhoneNum] = useState<string>('')

    const fetchUserById = async (userId: string) => {
      const { data, error } = await api.GET('/user/{userId}', {
        params: {
          path: {
            userId,
          },
        },
      })

      if (error) setIsError(true)
      if (!data) return

      return data.user
    }

    const fetchMembers = async () => {
      const { data, error } = await api.GET('/groupmember/{groupId}', {
        params: {
          path: {
            groupId: groupIdString,
          },
        },
      })

      if (error) setIsError(true)
      if (!data) return

      const membersWithProfileImage = await Promise.all(
        data.map(async (member) => {
          const extraUserData = await fetchUserById(member.userId)

          return {
            ...member,
            profileImage: extraUserData?.profileImage || '',
            firstName: extraUserData?.firstName || '',
            lastName: extraUserData?.lastName || '',
          }
        })
      )

      setMembers(membersWithProfileImage)
    }

    useEffect(() => {
      fetchMembers()
    }, [groupIdString])

    const inviteMember = async () => {
      if (phoneNum.length < 10) return

      const { data, error } = await api.POST('/groupmember/{groupId}', {
        params: {
          path: {
            groupId: groupIdString,
          },
        },
        body: {
          phone: phoneNum,
        },
      })

      if (error) setIsError(true)
      groupAlbumOptionsModalRef.current?.dismiss()
      // fetchAlbums();
      fetchGroupAlbums()
      // fetchMembers();
    }

    return (
      <View>
        <FlatList
          data={members}
          numColumns={1}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => <MemberCard member={item} />}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
        <View className="my-4 w-full h-[1px] border-solid border-[1px] border-gray-200"></View>
        <Text
          className="mb-8 text-4xl font-bold tracking-wider"
          style={{ fontFamily: 'Italiana_400Regular' }}
        >
          Invite Member
        </Text>

        <TextInput
          style={{ fontFamily: 'Nunito_400Regular' }}
          className="bg-white border-gray-200 border-solid border-2 p-4 mb-4 rounded-lg w-full"
          keyboardType="numeric"
          onChangeText={(text) => setPhoneNum(text)}
          value={phoneNum}
          placeholder="Phone Number"
          maxLength={10} //setting limit of input
        />

        <Button title="Invite Member" onPress={inviteMember} />

        {/* <DestructiveButton title='Remove Album from Group' onPress={removeSelectedAlbum}></DestructiveButton> */}
        {isError && <ErrorCard />}
      </View>
    )
  }

  const AddAlbumButton = () => {
    return (
      <TouchableHighlight
        className="justify-center rounded-full aspect-square align-middle"
        activeOpacity={0.1}
        underlayColor="#DDDDDD"
        onPress={createAddAlbumModal}
      >
        <Ionicons name="add-outline" size={40} />
      </TouchableHighlight>
    )
  }

  const AddMemberButton = () => {
    return (
      <TouchableHighlight
        className="justify-center rounded-full aspect-square align-middle"
        activeOpacity={0.1}
        underlayColor="#DDDDDD"
        onPress={createMembersModal}
      >
        <Ionicons name="people-outline" size={35} />
      </TouchableHighlight>
    )
  }

  return (
    <View className="flex-1 p-4 bg-white ">
      <View className="flex flex-row mb-6">
        <View className="flex-grow" />
        <AddMemberButton />
        <AddAlbumButton />
      </View>
      <View className="px-4 items-center justify-center">
        <Text
          className="text-5xl text-center w-5/6"
          style={{ fontFamily: 'Italiana_400Regular' }}
        >
          {groupData.name}
        </Text>
        <Text className="my-4 text-base text-center text-gray-600 ">
          {groupData.description}
        </Text>
      </View>
      <AlbumList />

      <BottomSheetModal
        ref={addAlbumModalRef}
        index={0}
        snapPoints={['50%']}
        style={{ shadowRadius: 6, shadowColor: '#000', shadowOpacity: 0.15 }}
      >
        <BottomSheetView style={contentContainerStyle}>
          <Text
            className="mb-8 text-4xl font-bold tracking-wider"
            style={{ fontFamily: 'Italiana_400Regular' }}
          >
            Add Album
          </Text>
          <AddAlbumForm />
        </BottomSheetView>
      </BottomSheetModal>

      {/* Actions modal */}
      <BottomSheetModal
        ref={groupAlbumOptionsModalRef}
        index={0}
        snapPoints={['50%']}
        style={{ shadowRadius: 6, shadowColor: '#000', shadowOpacity: 0.15 }}
      >
        <BottomSheetView style={contentContainerStyle}>
          <Text
            className="mb-8 text-4xl font-bold tracking-wider"
            style={{ fontFamily: 'Italiana_400Regular' }}
          >
            Option
          </Text>
          <GroupAlbumActions />
        </BottomSheetView>
      </BottomSheetModal>

      {/* Members modal */}
      <BottomSheetModal
        ref={membersModalRef}
        index={0}
        snapPoints={['90%']}
        style={{ shadowRadius: 6, shadowColor: '#000', shadowOpacity: 0.15 }}
      >
        <BottomSheetView style={contentContainerStyle}>
          <Text
            className="mb-8 text-4xl font-bold tracking-wider"
            style={{ fontFamily: 'Italiana_400Regular' }}
          >
            Members
          </Text>
          <GroupMembers />
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  )
}

export default GroupDetail
