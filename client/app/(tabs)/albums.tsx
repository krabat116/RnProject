import {
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  TouchableHighlight,
  StyleSheet,
  TextInput,
  Alert,
  Pressable,
} from 'react-native'

import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useFonts, Italiana_400Regular } from '@expo-google-fonts/italiana'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { useFocusEffect } from '@react-navigation/native'

// 👉 Cloudflare API Client
import { api } from '@/external/fetch'
import ErrorCard from '../../components/ErrorCard'
import Button, { DestructiveButton } from '../../components/CustomButton'

// 👉 필요한 경우 User Session에서 userId 가져오기
import { useUserSession } from '../../components/contexts/sessionContext'
import { useRouter } from 'expo-router'

type ImageItem = {
  id: string
  thumbnailUrl?: string
  imageUrl?: string
  widthpx?: number
  heightpx?: number
}
type AlbumImage = { id: string; url: string }

type Album = {
  id: string
  name: string
  description?: string
  thumbnailUrl?: string
  numImages?: number
  images?: { id: string; url: string }[]
}

export default function Albums() {
  const [fontsLoaded] = useFonts({
    Italiana_400Regular,
  })
  const [albums, setAlbums] = useState<Album[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<Album | undefined>(
    undefined
  )

  const { bottom: bottomSafeArea } = useSafeAreaInsets()
  const albumOptionsModalRef = useRef<BottomSheetModal>(null)
  const addAlbumModalRef = useRef<BottomSheetModal>(null)

  const { userId } = useUserSession()

  const createAlbumOptionsModal = useCallback(() => {
    albumOptionsModalRef.current?.present()
  }, [])
  const createAddAlbumModal = useCallback(() => {
    addAlbumModalRef.current?.present()
  }, [])

  const styles = StyleSheet.create({
    contentContainer: {
      flex: 1,
      padding: 18,
      minHeight: 200,
    },
  })

  const contentContainerStyle = useMemo(
    () => ({
      ...styles.contentContainer,
      paddingBottom: bottomSafeArea,
    }),
    [bottomSafeArea]
  )

  // ---------------- API 연동 ----------------
  const fetchAlbums = async () => {
    if (!userId) return
    try {
      // 1) 앨범 ID 목록 가져오기
      const { data, error } = await api.GET('/album/all/{userId}', {
        params: { path: { userId } },
      })
      if (error) {
        console.error('Failed to fetch albums:', error)
        return
      }

      const albumIds = data?.albumIds || []
      if (albumIds.length === 0) {
        setAlbums([])
        return
      }

      const fetchImages = async (albumId: string, limit = 4) => {
        try {
          const { data, error } = await api.GET('/image/all/{albumId}', {
            params: { path: { albumId } },
          })
          if (error) {
            console.error('Error fetching images:', error)
            return []
          }
          const arr = Array.isArray(data)
            ? data
            : data && typeof data === 'object' && 'images' in data
            ? (data as any).images
            : []
          return arr.slice(0, limit).map((image: any) => ({
            id: image.id,
            url: image.thumbnailUrl || image.imageUrl,
          }))
        } catch (err) {
          console.error('Unexpected error:', err)
          return []
        }
      }
      const albumDetails = await Promise.all(
        albumIds.map(async (albumId) => {
          // 1️⃣ 앨범 메타데이터 가져오기
          const { data: albumData, error: albumError } = await api.GET(
            '/album/{albumId}',
            {
              params: { path: { albumId } },
            }
          )
          if (albumError) {
            console.error(`Failed to fetch album ${albumId}:`, albumError)
            return null
          }

          const album = albumData?.album
          if (!album) return null

          // 2️⃣ 썸네일 4장 가져오기
          const images = await fetchImages(albumId, 4)

          // 3️⃣ 앨범 객체 구성 (images 추가)
          return {
            id: album.id,
            name: album.name,
            description: album.description,
            numImages: album.numImages,
            images, // 👈 썸네일 배열
            thumbnailUrl: album.thumbnailUrl || images?.[1]?.url || undefined,
          } as Album
        })
      )

      // 3) null 제거 후 상태 업데이트
      setAlbums(albumDetails.filter((a): a is Album => a !== null))
    } catch (err) {
      console.error('Error fetching albums:', err)
    }
  }

  const addAlbum = async (name: string, desc: string) => {
    try {
      const { data, error } = await api.POST('/album', {
        body: {
          ownerId: userId || '',
          name,
          description: desc,
        },
      })
      if (error) {
        console.error('Failed to create album:', JSON.stringify(error, null, 2))
        return
      }
      // 새로고침
      fetchAlbums()
    } catch (err) {
      console.error('Error creating album:', err)
    }
  }

  const deleteAlbum = async (id: string) => {
    try {
      const { error } = await api.DELETE('/album/{albumId}', {
        params: { path: { albumId: id } },
      })
      if (error) {
        console.error('Failed to delete album:', error)
        return
      }
      fetchAlbums()
    } catch (err) {
      console.error('Error deleting album:', err)
    }
  }
  // -------------------------------------------

  useEffect(() => {
    fetchAlbums()
  }, [userId])

  useFocusEffect(
    useCallback(() => {
      fetchAlbums()
    }, [userId])
  )

  const CreateAlbumForm = () => {
    const [newAlbumName, setNewAlbumName] = useState('')
    const [newAlbumDesc, setNewAlbumDesc] = useState('')
    const [isError, setIsError] = useState(false)

    const createNewGroup = () => {
      if (newAlbumName.trim() === '' || newAlbumDesc.trim() === '') {
        setIsError(true)
        return
      }
      setIsError(false)
      addAlbum(newAlbumName, newAlbumDesc)
      addAlbumModalRef.current?.dismiss()
    }

    return (
      <>
        <TextInput
          className="bg-white border-gray-200 border-solid border-2 p-4 mb-4 rounded-lg w-full"
          placeholder="Name"
          placeholderTextColor="#6b7280"
          value={newAlbumName}
          onChangeText={(value) => setNewAlbumName(value)}
        />
        <TextInput
          className="bg-white border-gray-200 border-solid border-2 p-4 mb-4 rounded-lg w-full"
          placeholder="Description"
          placeholderTextColor="#6b7280"
          value={newAlbumDesc}
          onChangeText={(value) => setNewAlbumDesc(value)}
        />
        <Button title="Create" onPress={createNewGroup} />
        {isError && <ErrorCard />}
      </>
    )
  }

  const AlbumActions = () => {
    return (
      <View>
        <DestructiveButton
          title="Delete Album"
          onPress={() => {
            if (selectedAlbum) deleteAlbum(selectedAlbum.id)
            albumOptionsModalRef.current?.dismiss()
          }}
        />
      </View>
    )
  }
  const AlbumComponent: FC<{ album: Album }> = ({ album }) => {
    const router = useRouter()
    const gridImages = (album.images ?? []).slice(0, 4)
    const placeholder = 'https://via.placeholder.com/300?text=Album'

    const onLongPress = () => {
      Alert.alert(
        'Delete album?',
        `"${album.name}" will be deleted.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteAlbum(album.id)
            },
          },
        ],
        { cancelable: true }
      )
    }

    return (
      <View className="mb-6 w-1/2">
        <Pressable
          onPress={() => {
            router.push({
              pathname: '/(routes)/albums/[albumId]',
              params: { albumId: album.id, name: album.name },
            })
          }}
          onLongPress={onLongPress}
          delayLongPress={600}
        >
          <View className="w-full aspect-square p-2">
            <View className="w-full h-full overflow-hidden rounded-md bg-gray-100">
              {gridImages.length > 0 ? (
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignContent: 'space-between',
                    padding: 1,
                  }}
                >
                  {gridImages.map((img, idx) => (
                    <Image
                      key={img.id ?? idx}
                      source={{ uri: img?.url ?? placeholder }}
                      style={{ width: '49%', height: '49%' }}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              ) : (
                <Image
                  className="w-full h-full"
                  source={{ uri: album.thumbnailUrl || placeholder }}
                  resizeMode="cover"
                />
              )}
            </View>
          </View>

          <Text className="text-left text-xl font-thin ml-2 mt-1">
            {album.name}
          </Text>
          <Text className="text-xs text-gray-400 ml-2">
            {(album.numImages ?? album.images?.length ?? 0) + ' photos'}
          </Text>
        </Pressable>
      </View>
    )
  }

  const AlbumList = () => (
    <FlatList
      data={albums}
      numColumns={2}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <AlbumComponent album={item} />}
      contentContainerStyle={{ paddingBottom: 16 }}
    />
  )

  const AddAlbumButton = () => (
    <TouchableHighlight
      className="justify-center rounded-full aspect-square align-middle"
      activeOpacity={0.1}
      underlayColor="#DDDDDD"
      onPress={createAddAlbumModal}
    >
      <Ionicons name="add-outline" size={40} />
    </TouchableHighlight>
  )

  return (
    <SafeAreaView className="flex-1 p-4 bg-white">
      <View className="flex flex-row mb-6">
        <Text
          className="flex-grow text-4xl tracking-wider"
          style={{ fontFamily: 'Italiana_400Regular' }}
        >
          Albums
        </Text>
        <AddAlbumButton />
      </View>
      <AlbumList />
      <BottomSheetModal ref={addAlbumModalRef} index={0} snapPoints={['50%']}>
        <BottomSheetView style={contentContainerStyle}>
          <Text
            className="mb-8 text-4xl font-bold tracking-wider"
            style={{ fontFamily: 'Italiana_400Regular' }}
          >
            Create Album
          </Text>
          <CreateAlbumForm />
        </BottomSheetView>
      </BottomSheetModal>
      <BottomSheetModal
        ref={albumOptionsModalRef}
        index={0}
        snapPoints={['50%']}
      >
        <BottomSheetView style={contentContainerStyle}>
          <Text
            className="mb-8 text-4xl font-bold tracking-wider"
            style={{ fontFamily: 'Italiana_400Regular' }}
          >
            {selectedAlbum?.name}
          </Text>
          <AlbumActions />
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  )
}
